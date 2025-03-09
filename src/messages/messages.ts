import { Hono } from "hono";
import { KafkaVerifyToken } from "../../helper/JwtHelpers/kafkaVerifyToken";
import { producer } from "../../kafka/kafka";
import { MessageType, Message, MessageStatus } from "../../models/messages/messages";
import { Conversation } from "../../models/conversations/conversations";
import { Types } from "mongoose";

const messageRouter = new Hono();

// 🔹 Authentication Middleware
const authenticateKafka = async (c: any) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json({ error: "Authorization token is required" }, 401);
    }

    const token = authHeader.split(" ")[1];
    const tokenVerification = await KafkaVerifyToken(token);
    if (tokenVerification.error) {
      return c.json({ error: tokenVerification.error }, 401);
    }

    return tokenVerification.decoded?.id; // ✅ Return user ID directly
  } catch (error) {
    return c.json({ error: "Authentication failed" }, 401);
  }
};

// 🔹 Send Message API (Kafka Producer)
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

    // Publish message to Kafka
    await producer.send({
      topic: "message",
      messages: [
        {
          key: "NEW_MESSAGE",
          value: JSON.stringify({
            senderId: userId,
            receiverId,
            content,
            messageType,
            files: files || [], // Include files if provided
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    });

    return c.json({ success: true, message: "Message queued successfully!" });
  } catch (error) {
    console.error("Error publishing message:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

// 🔹 Get Messages Between Two Users
messageRouter.get("/conversation/:receiverId", async (c) => {
  try {
    const userId = await authenticateKafka(c);
    if (typeof userId !== "string") return userId;

    const receiverId = c.req.param("receiverId");
    if (!receiverId) {
      return c.json({ error: "Receiver ID is required" }, 400);
    }

    // Validate ObjectId format
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(receiverId)) {
      return c.json({ error: "Invalid user or receiver ID" }, 400);
    }

    const senderObjectId = new Types.ObjectId(userId);
    const receiverObjectId = new Types.ObjectId(receiverId);

    // Find the conversation between the two users
    const conversation = await Conversation.findOne({
      participants: { $all: [senderObjectId, receiverObjectId] },
    });

    if (!conversation) {
      return c.json({ messages: [], message: "No conversation found" }, 200);
    }

    // Get query parameters for pagination
    const page = parseInt(c.req.query("page") || "1", 10);
    const limit = parseInt(c.req.query("limit") || "20", 10);
    const skip = (page - 1) * limit;

    // Fetch messages for this conversation
    const messages = await Message.find({
      conversationId: conversation._id,
    })
      .sort({ createdAt: -1 }) // Newest first
      .skip(skip)
      .limit(limit)
      .lean();

    const totalMessages = await Message.countDocuments({
      conversationId: conversation._id,
    });

    return c.json({
      success: true,
      messages,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalMessages / limit),
        totalMessages,
      },
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
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