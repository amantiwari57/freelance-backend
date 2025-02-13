import mongoose from "mongoose";

const MONGODB_URL = process.env.MONGODB_URL || "your-mongodb-connection-string";

export const connectDB = async () => {
  try {
    if (mongoose.connection.readyState >= 1) {
      return; // ✅ Already connected
    }
    await mongoose.connect(MONGODB_URL);
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
  }
};
