import mongoose, { Schema, Document } from "mongoose";

export interface IVisitor extends Document {
  ip: string;
  userAgent: string;
  visitedAt: Date;
}

const VisitorSchema: Schema = new Schema<IVisitor>(
  {
    ip: { type: String, required: true },
    userAgent: { type: String, required: true },
    visitedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.Visitor ||
  mongoose.model<IVisitor>("Visitor", VisitorSchema);
