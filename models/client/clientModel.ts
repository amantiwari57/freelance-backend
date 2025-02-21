import mongoose, { Schema, Document } from "mongoose";

export interface IClientProfile extends Document {
  userId: mongoose.Types.ObjectId;
  userType: "client";
  country: string;
  city: string;
  clientType: "company" | "individual";
  verification: mongoose.Types.ObjectId;
  clientImage: string;
  reviews: mongoose.Types.ObjectId[];
  timestamp: Date;
  companySize?: "small" | "medium" | "large";
  jobStats: mongoose.Types.ObjectId;
}

const ClientProfileSchema = new Schema<IClientProfile>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  userType: {
    type: String,
    enum: ["client"],
    required: true,
    default: "client",
  },
  country: { type: String, required: true },
  city: { type: String, required: true },
  clientImage: { type: String, required: false },
  clientType: { type: String, enum: ["company", "individual"], required: true },
  verification: { type: Schema.Types.ObjectId, ref: "Verification" },
  reviews: [{ type: Schema.Types.ObjectId, ref: "Review" }],
  timestamp: { type: Date, default: Date.now },
  companySize: {
    type: String,
    enum: ["small", "medium", "large"],
    required: function (this: IClientProfile) {
      return this.clientType === "company";
    },
  },
  jobStats: { type: Schema.Types.ObjectId, ref: "JobStats" },
});

const ClientProfile = mongoose.model<IClientProfile>(
  "ClientProfile",
  ClientProfileSchema
);
export default ClientProfile;
