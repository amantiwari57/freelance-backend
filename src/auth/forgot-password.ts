import { Hono } from "hono";
import { z } from "zod";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";
import { connectDB } from "../../helper/dbConnect";
import User from "../../models/user/userModel";
import { sendMail } from "../../helper/emailSender";

const forgotPassword = new Hono();

forgotPassword.post("/auth/forgot-password", async (c) => {
  try {
    const body = await c.req.json();
    const { email } = z.object({ email: z.string().email() }).parse(body);

    const user = await User.findOne({ email });
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = await bcrypt.hash(resetToken, 10);
    user.resetToken = hashedToken;
    user.resetTokenExpiry = Date.now() + 3600000; // 1 hour expiry

    await user.save();


    // console.log(resetToken);
    // Create Reset Link
    const resetLink = `http://yourdomain.com/reset-password?token=${resetToken}&email=${email}`;

    // Send Email using the helper function
    await sendMail(
      user.email,
      "Reset Your Password",
      `
        <h2>Password Reset Request</h2>
        <p>You requested to reset your password. Click the link below:</p>
        <a href="${resetLink}" style="color: blue;">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request this, please ignore this email.</p>
      `
    );

    return c.json({ message: "Password reset link sent to your email" });
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : "Invalid request" }, 400);
  }
});
forgotPassword.post("/auth/reset-password", async (c) => {
    try {
      const body = await c.req.json();
      const { email, token, newPassword } = z.object({
        email: z.string().email(),
        token: z.string(),
        newPassword: z.string().min(6),
      }).parse(body);
  
      const user = await User.findOne({ email });
      if (!user || !user.resetToken || user.resetTokenExpiry < Date.now()) {
        return c.json({ error: "Invalid or expired token" }, 400);
      }
  
      // Verify token
      const isValid = await bcrypt.compare(token, user.resetToken);
      if (!isValid) {
        return c.json({ error: "Invalid token" }, 400);
      }
  
      // Update password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      user.resetToken = undefined;
      user.resetTokenExpiry = undefined;
      await user.save();
  
      return c.json({ message: "Password reset successful" });
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Invalid request" }, 400);
    }
  });

export default forgotPassword;
