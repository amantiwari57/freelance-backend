import mongoose, { Schema, Document, Types } from "mongoose";

export interface IJobMilestone extends Document {
  jobId: Types.ObjectId; // Reference to Job instead of Proposal
  description: string;
  dueDate: Date;
  price: number;
  status: "pending" | "completed" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

const JobMilestoneSchema = new Schema<IJobMilestone>(
  {
    jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true }, // Updated to Job
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

export const JobMilestone = mongoose.model<IJobMilestone>(
  "JobMilestone",
  JobMilestoneSchema
);
