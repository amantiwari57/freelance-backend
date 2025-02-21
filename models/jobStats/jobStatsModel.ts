import mongoose, { Schema, Document } from "mongoose";

export interface IJobStats extends Document {
  userId: mongoose.Types.ObjectId;
  totalJobs: number; // Referencing totalJobs from ClientProfile
  hireRate: number; // Percentage
  openJobs: number;
  totalSpent: string; // Representing monetary values, e.g., "$5k+"
  hires: number;
  activeJobs: number;
  avgHourlyRate: number; // In dollars per hour
  totalHours: number;
}

const JobStatsSchema = new Schema<IJobStats>({
  userId: { type: Schema.Types.ObjectId, ref: "ClientProfile", required: true },
  totalJobs: {
    type: Number,
    required: true,
  },
  hireRate: { type: Number, required: true, default: 0 }, // Stored as percentage
  openJobs: { type: Number, required: true, default: 0 },
  totalSpent: { type: String, required: true, default: "$0" }, // Could be stored as Number for calculations
  hires: { type: Number, required: true, default: 0 },
  activeJobs: { type: Number, required: true, default: 0 },
  avgHourlyRate: { type: Number, required: true, default: 0 }, // Dollar per hour
  totalHours: { type: Number, required: true, default: 0 },
});

const JobStats = mongoose.model<IJobStats>("JobStats", JobStatsSchema);
export default JobStats;
