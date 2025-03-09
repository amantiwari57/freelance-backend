import mongoose, { Schema, Document, Types } from "mongoose";

export interface IJob extends Document {
  userId: Types.ObjectId;
  userType: "client";
  jobTitle: string;
  description: string;
  skills: string[];
  timeline: "small" | "medium" | "large";
  totalTime: "1 month" | "3 months" | "6monthsormore";
  expertiseLevel: "entry" | "intermediate" | "expert";
  paymentType: "fixed" | "hourly";
  fixedPaymentType?: "milestone" | "project";
  location?: string;
  price?: number;
  isOpen: boolean;
  pricePerHour?: { min: number; max: number };
  milestones?: {
    description: string;
    dueDate: Date;
    price: number;
    status: "pending" | "completed" | "cancelled";
  }[];
  files: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

const JobSchema: Schema = new Schema<IJob>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userType: { type: String, enum: ["client"], required: true },
    jobTitle: { type: String, required: true },
    description: { type: String, required: true },
    skills: { type: [String], required: true },
    timeline: { type: String, enum: ["small", "medium", "large"], required: true },
    totalTime: { type: String, enum: ["1 month", "3 months", "6monthsormore"], required: true },
    expertiseLevel: { type: String, enum: ["entry", "intermediate", "expert"], required: true },
    location: { type: String, default: "Unknown" },
    isOpen: { type: Boolean, required: true },
    paymentType: { type: String, enum: ["fixed", "hourly"], required: true },
    fixedPaymentType: {
      type: String,
      enum: ["milestone", "project"],
      required: function () {
        return this.paymentType === "fixed";
      },
    },
    price: {
      type: Number,
      required: function () {
        return this.paymentType === "fixed";
      },
    },
    pricePerHour: {
      min: {
        type: Number,
        required: function () {
          return this.paymentType === "hourly";
        },
      },
      max: {
        type: Number,
        required: function () {
          return this.paymentType === "hourly";
        },
      },
    },
    files: { type: [String], default: [] },
    milestones: [
      {
        description: { type: String, required: true },
        dueDate: { type: Date, required: true },
        price: { type: Number, required: true },
        status: {
          type: String,
          enum: ["pending", "completed", "cancelled"],
          default: "pending",
        },
      },
    ],
  },
  { timestamps: true }
);

const Job = mongoose.model<IJob>("Job", JobSchema);
export default Job;
