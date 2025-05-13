import { Hono } from "hono";
import { MessageVerifyToken } from "../../helper/JwtHelpers/kafkaVerifyToken";
import { MessageType, Message, MessageStatus } from "../../models/messages/messages";
import { Conversation } from "../../models/conversations/conversations";
import { Types } from "mongoose";
import { publishMessage } from "../../redis/redis";

const messageRouter = new Hono();

// 🔹 Authentication Middleware
export const authenticateKafka = async (c: any) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json({ error: "Authorization token is required" }, 401);
    }

    const token = authHeader.split(" ")[1];
    const tokenVerification = await MessageVerifyToken(token);
    if (tokenVerification.error) {
      return c.json({ error: tokenVerification.error }, 401);
    }

    return tokenVerification.decoded?.id; // ✅ Return user ID directly
  } catch (error) {
    return c.json({ error: "Authentication failed" }, 401);
  }
};

// 🔹 Send Message API (Redis Publisher)
messageRouter.post("/send", async (c) => {
  try {
    const userId = await authenticateKafka(c);
    if (typeof userId !== "string") return userId;

    // Parse request body
    const { receiverId, content, messageType, files } = await c.req.json();

    // Validate required fields
    if (!receiverId || !content || !messageType) {
      return c.json(
        {
          error: "Missing required fields: receiverId, content, or messageType",
        },
        400
      );
    }

    // Validate messageType
    if (!Object.values(MessageType).includes(messageType)) {
      return c.json({ error: "Invalid messageType" }, 400);
    }

    // Validate files (if provided)
    if (
      files &&
      (!Array.isArray(files) || files.some((file) => typeof file !== "string"))
    ) {
      return c.json(
        { error: "Files must be an array of strings (file URLs or paths)" },
        400
      );
    }

    // Publish message to Redis
    const messageData = JSON.stringify({
      senderId: userId,
      receiverId,
      content,
      messageType,
      files: files || [], // Include files if provided
      timestamp: new Date().toISOString(),
    });

    const published = await publishMessage("message", messageData);

    if (!published) {
      return c.json({ error: "Failed to publish message" }, 500);
    }

    return c.json({ success: true, message: "Message queued successfully!" });
  } catch (error) {
    console.error("Error publishing message:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

// Get conversation messages
messageRouter.get("/conversation/:conversationId", async (c) => {
  try {
    const userId = await authenticateKafka(c);
    if (typeof userId !== "string") return userId;

    const conversationId = c.req.param("conversationId");
    
    // Validate conversationId
    if (!Types.ObjectId.isValid(conversationId)) {
      return c.json({ error: "Invalid conversation ID" }, 400);
    }

    // Check if user is part of the conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return c.json({ error: "Conversation not found" }, 404);
    }

    // Convert userId string to ObjectId for comparison
    const userObjectId = new Types.ObjectId(userId);
    
    // Check if user is a participant
    if (!conversation.participants.some(p => p.equals(userObjectId))) {
      return c.json({ error: "You are not authorized to view this conversation" }, 403);
    }

    // Get messages
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .populate("sender", "name email");

    return c.json({ success: true, messages });
  } catch (error) {
    console.error("Error fetching conversation messages:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

// 🔹 Get All Conversations for a User
messageRouter.get("/conversations", async (c) => {
  try {
    const userId = await authenticateKafka(c);
    if (typeof userId !== "string") return userId;

    if (!Types.ObjectId.isValid(userId)) {
      return c.json({ error: "Invalid user ID" }, 400);
    }

    const userObjectId = new Types.ObjectId(userId);

    // Find all conversations involving the user
    const conversations = await Conversation.find({
      participants: userObjectId,
    })
      .populate({
        path: "participants",
        select: "firstName lastName image", // Adjust fields based on your User model
      })
      .lean();

    // For each conversation, get the most recent message
    const conversationsWithLastMessage = await Promise.all(
      conversations.map(async (conv) => {
        const lastMessage = await Message.findOne({
          conversationId: conv._id,
        })
          .sort({ createdAt: -1 })
          .lean();

        return {
          ...conv,
          lastMessage: lastMessage || null,
        };
      })
    );

    return c.json({
      success: true,
      conversations: conversationsWithLastMessage,
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

export default messageRouter;