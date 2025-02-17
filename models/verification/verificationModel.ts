import mongoose, { Schema, Document, Types } from "mongoose";

export interface IVerification extends Document {
  userId: Types.ObjectId;
  isEmailVerified: boolean;
  isIdentityVerified: boolean;
  isPhneVerified: boolean;
  isPaymentMethodVerified: boolean;
  verificationDocuments: string[];
}

const VerificationSchema = new Schema<IVerification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isEmailVerified: { type: Boolean, default: false },
    isIdentityVerified: { type: Boolean, default: false },
    isPhneVerified: { type: Boolean, default: false },
    isPaymentMethodVerified: { type: Boolean, default: false },
    verificationDocuments: [{ type: String }], // Store file URLs or paths
  },
  { timestamps: true }
);

const Verification =
  mongoose.models.Verification ||
  mongoose.model<IVerification>("Verification", VerificationSchema);
export default Verification;
