import { Hono } from "hono";
import { sign } from "hono/jwt";
import { z } from "zod";
import { connectDB } from "../../helper/dbConnect";
import * as bcrypt from "bcryptjs";
import User from "../../models/user/userModel";

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

    // 🔹 Generate JWT token
    const token = await sign({ email: newUser.email, id: newUser._id }, process.env.JWT_SECRET!);

    return c.json({ message: "User registered successfully", token, userType: newUser.userType }, 201);
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : "Invalid request" },
      {status: 500}
    );
  }
});

export default signup;
