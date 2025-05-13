import { Types } from "mongoose";
import { Message, MessageStatus, MessageType } from "../models/messages/messages";
import { Conversation } from "../models/conversations/conversations";

// Define the parameters for saving a message
export interface SaveMessageParams {
  senderId: string;
  receiverId: string;
  content: string;
  messageType: MessageType;
  files?: string[];
  timestamp?: Date;
}

/**
 * Saves a message to the database
 * @param messageData The message data to save
 * @returns The saved message
 */
export const saveMessageToDB = async (messageData: SaveMessageParams) => {
  try {
    const { senderId, receiverId, content, messageType, files, timestamp } = messageData;

    if (!senderId || !receiverId || !content || !messageType) {
      throw new Error("Missing required fields: senderId, receiverId, content, or messageType");
    }

    if (senderId === receiverId) {
      throw new Error("Sender and receiver cannot be the same");
    }

    const senderObjectId = new Types.ObjectId(senderId.trim());
    const receiverObjectId = new Types.ObjectId(receiverId.trim());

    console.log("senderObjectId:", senderObjectId.toString());
    console.log("receiverObjectId:", receiverObjectId.toString());
    console.log("Querying with participants:", [senderObjectId, receiverObjectId]);

    let conversation = await Conversation.findOne({
      participants: { $all: [senderObjectId, receiverObjectId] },
    });

    if (!conversation) {
      console.log("No conversation found, creating a new one...");
      conversation = await new Conversation({
        participants: [senderObjectId, receiverObjectId],
      }).save();
      console.log("New conversation created:", conversation);
    }

    const newMessage = await Message.create({
      conversationId: conversation._id,
      sender: senderObjectId,
      content,
      messageType,
      files: files || [],
      status: MessageStatus.SENT,
      createdAt: timestamp || new Date(),
    });

    return newMessage;
  } catch (error) {
    console.error("Error saving message:", error);
    throw error;
  }
}; 