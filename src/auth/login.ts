import { Hono } from "hono";
import { z } from "zod";
import * as bcrypt from "bcryptjs";
import { connectDB } from "../../helper/dbConnect";
import User from "../../models/user/userModel";
import { generateAccessToken, generateRefreshToken } from "../../helper/JwtHelpers/jwtHelper";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const login = new Hono();

login.post("/auth/login", async (c) => {
  try {
    // await connectDB();
    const body = await c.req.json();
    const { email, password } = loginSchema.parse(body); // ✅ Validate input

    // 🔹 Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return c.json({ error: "Invalid email or password" }, 400);
    }

    // 🔹 Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return c.json({ error: "Invalid email or password" }, 400);
    }

    // 🔹 Generate access and refresh tokens
    const accessToken = await generateAccessToken({ email: user.email, id: user._id });
    const refreshToken = await generateRefreshToken({ email: user.email, id: user._id });

    return c.json({
      message: "Logged in successfully",
      accessToken,
      refreshToken,
      userType: user.userType,
      userId: user._id,
      user
    }, 201);
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : "Invalid request" },
      400
    );
  }
});

export default login;
