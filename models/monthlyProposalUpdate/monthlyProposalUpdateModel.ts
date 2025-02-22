import mongoose, { Schema, Document } from "mongoose";

export interface IMonthDetails {
  month: string; // e.g., "January"
  year: number; // e.g., 2025
  proposalsProvided: number; // Number of proposals refreshed
}

export interface IProposalRefreshTracker extends Document {
  proposalsToRefresh: number; // Total proposals that can be refreshed
  monthDetails: IMonthDetails; // Tracks month, year, and proposals refreshed
}

const ProposalRefreshTrackerSchema = new Schema<IProposalRefreshTracker>(
  {
    proposalsToRefresh: { type: Number, default: 0 }, // Total proposals available for refresh
    monthDetails: {
      month: { type: String, required: true }, // "January", "February", etc.
      year: { type: Number, required: true }, // Year tracking
      proposalsProvided: { type: Number, default: 0 }, // Proposals refreshed count
    },
  },
  { timestamps: true }
);

export const ProposalRefreshTracker = mongoose.model<IProposalRefreshTracker>(
  "ProposalRefreshTracker",
  ProposalRefreshTrackerSchema
);
