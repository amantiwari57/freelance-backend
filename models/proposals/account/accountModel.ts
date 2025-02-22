import mongoose, { Schema, Document, Types } from "mongoose";

export interface IProposalAccount extends Document {
  userId: Types.ObjectId;
  userType: "freelancer";
  proposalCount: number;
}

const ProposalAccountSchema = new Schema<IProposalAccount>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    userType: { type: String, enum: ["freelancer"], required: true },
    proposalCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const ProposalAccount = mongoose.model<IProposalAccount>(
  "ProposalAccount",
  ProposalAccountSchema
);
