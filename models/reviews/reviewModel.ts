import mongoose, { Schema, Document, Types } from "mongoose";

export interface IReview extends Document {
  reviewerId: Types.ObjectId; // User who gives the review
  profileId: Types.ObjectId; // Profile being reviewed
  rating: number; // 1-5 stars
  comment: string;
}

const ReviewSchema = new Schema<IReview>(
  {
    reviewerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    profileId: { type: Schema.Types.ObjectId, ref: "Profile", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
  },
  { timestamps: true }
);

const Review = mongoose.models.Review || mongoose.model<IReview>("Review", ReviewSchema);
export default Review;
