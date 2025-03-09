import { model, Schema, Document, Types } from "mongoose";

export interface IConversation extends Document {
  participants: Types.ObjectId[];
  createdAt: Date;
}

const ConversationSchema = new Schema<IConversation>({
  participants: {
    type: [Schema.Types.ObjectId],
    ref: "User",
    required: true,
    validate: {
      validator: (v: Types.ObjectId[]) => v.length === 2,
      message: "Conversation must have exactly 2 participants",
    },
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
    immutable: true // Prevents updates to createdAt after initial creation
  },
});

// Pre-save hook to sort participants for consistent uniqueness
ConversationSchema.pre<IConversation>("save", function (next) {
  // Sort participants by string representation to ensure [A, B] === [B, A]
  this.participants.sort((a, b) => a.toString().localeCompare(b.toString()));
  next();
});

// Compound unique index on the entire participants array
ConversationSchema.index(
  { "participants.0": 1, "participants.1": 1 }, // Explicitly index both positions
  { 
    unique: true,
    name: "participants_unique" // Custom name for clarity
  }
);

// Ensure indexes are built correctly on schema load
ConversationSchema.set("autoIndex", true); // Automatically sync indexes with MongoDB

export const Conversation = model<IConversation>(
  "Conversation",
  ConversationSchema
);