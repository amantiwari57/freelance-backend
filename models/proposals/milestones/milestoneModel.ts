import mongoose, { Schema, Document, Types } from "mongoose";

export interface IMilestone extends Document {
  proposalId: Types.ObjectId;
  description: string;
  dueDate: Date;
  price: number;
  status: "pending" | "completed" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

const MilestoneSchema = new Schema<IMilestone>(
  {
    proposalId: { type: Schema.Types.ObjectId, ref: "Proposal", required: true },
    description: { type: String, required: true },
    dueDate: { type: Date, required: true },
    price: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "completed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export const Milestone = mongoose.model<IMilestone>("Milestone", MilestoneSchema);
