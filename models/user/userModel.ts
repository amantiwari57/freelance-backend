import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  userType: "admin" | "freelancer" | "client";
  country: string;
  image: string;
  termsandconditions: boolean;
  createdAt: Date;
  updatedAt: Date;
  isAdmin:boolean
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    userType: {
      type: String,
      enum: [ "freelancer", "client"],
      required: true,
    },
    country: { type: String, required: true },
    image: { type: String, required: false },
    termsandconditions: { type: Boolean, required: true },
    isAdmin:{type:Boolean, required:true, default:false},
  },
  { timestamps: true } // ✅ Adds `createdAt` and `updatedAt`
);

const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
export default User;
