import { Schema, model, models } from "mongoose";

const MilestoneSchema = new Schema({
  description: { type: String, required: true },
  dueDate: { type: Date, required: true },
  price: { type: Number, required: true },
  status: {
    type: String,
    enum: ["pending", "completed", "cancelled"],
    default: "pending",
  },
});

const AgreementSchema = new Schema(
  {
    jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true }, // Links to Job
    freelancerId: { type: Schema.Types.ObjectId, ref: "User", required: true }, // Freelancer
    clientId: { type: Schema.Types.ObjectId, ref: "User", required: true }, // Client
    jobDescription: { type: String, required: true },
    milestones: { type: [MilestoneSchema], required: true }, // Updated Milestone structure
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "deployed"],
      default: "pending",
    },
    contractAddress: { type: String, default: null }, // Smart contract address
  },
  { timestamps: true }
);

export const Agreement =
  models.Agreement || model("Agreement", AgreementSchema);
