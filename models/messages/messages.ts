import { model, Schema, Document, Types } from "mongoose";

export enum MessageStatus {
  SENT = "sent",
  DELIVERED = "delivered",
  READ = "read",
}

export enum MessageType {
  TEXT = "text",
  IMAGE = "image",
  VIDEO = "video",
  AUDIO = "audio",
  FILE = "file",
  LINK = "link",
}

export interface IMessage extends Document {
  conversationId: Types.ObjectId;
  sender: Types.ObjectId;
  content: string;
  status: MessageStatus;
  messageType: MessageType;
  files?: string[]; // Array of file URLs or paths
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  conversationId: {
    type: Schema.Types.ObjectId,
    ref: "Conversation",
    required: true,
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  content: { type: String, required: true },
  status: {
    type: String,
    enum: Object.values(MessageStatus),
    default: MessageStatus.SENT,
  },
  messageType: {
    type: String,
    enum: Object.values(MessageType),
    required: true,
  },
  files: [{ type: String }], // Array of file URLs or paths
  createdAt: { type: Date, default: Date.now },
});

// Index for efficient message retrieval
MessageSchema.index({ conversationId: 1, createdAt: 1 });

export const Message = model<IMessage>("Message", MessageSchema);
