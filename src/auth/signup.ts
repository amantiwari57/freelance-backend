import { Hono } from "hono";
import { z } from "zod";
import { connectDB } from "../../helper/dbConnect";
import * as bcrypt from "bcryptjs";
import User from "../../models/user/userModel";
import { generateAccessToken, generateRefreshToken } from "../../helper/JwtHelpers/jwtHelper";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string(),
  lastName: z.string(),
  userType: z.enum(["admin", "freelancer", "client"]),
  country: z.string(),
  image: z.string().optional(),
  termsandconditions: z.boolean(),
});

const signup = new Hono();

signup.post("/auth/signup", async (c) => {
  try {
    // await connectDB();
    const body = await c.req.json();
    const validatedData = signupSchema.parse(body); // ✅ Validate with Zod

    // 🔹 Check if user already exists
    const existingUser = await User.findOne({ email: validatedData.email });
    if (existingUser) {
      return c.json({ error: "User already exists" }, 400);
    }

    // 🔹 Hash password before saving
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // 🔹 Get isAdmin from environment variables
    const isAdmin = process.env.IS_ADMIN === "true"; // Convert to boolean

    // 🔹 Create new user
    const newUser = new User({
      ...validatedData,
      password: hashedPassword, // ✅ Store hashed password
      isAdmin, // ✅ Use environment variable value
    });

    await newUser.save();

    // Generate access and refresh tokens
    const accessToken = await generateAccessToken({ email: newUser.email, id: newUser._id });
    const refreshToken = await generateRefreshToken({ email: newUser.email, id: newUser._id });

    return c.json({
      message: "User registered successfully",
      accessToken,
      refreshToken,
      userType: newUser.userType,
      userId: newUser._id,
      newUser
    }, 201);
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : "Invalid request" },
      {status: 500}
    );
  }
});

export default signup;
