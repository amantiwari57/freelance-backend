import { Hono } from "hono";
import { sign } from "hono/jwt";
import User from "../../models/user/userModel";
import { OAuth2Client } from "google-auth-library";
import { verifyToken } from "../../helper/JwtHelpers/verifyToken";
import { cors } from "hono/cors";


const googleAuth = new Hono();

googleAuth.use(
  cors({
    origin: [
      "https://freelancer.vercel.app",
      "http://localhost:3000",
      "http://localhost:3001",
      "https://freelance-1-orpin.vercel.app",
    ],
    allowHeaders: [
      "Content-Type",
      "Authorization",
    ],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true, // ✅ Important for cookies/auth headers
    maxAge: 86400,
  })
);
// Initialize Google OAuth client
const oauth2Client = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI,
});

console.log("Backend is using redirect URI:", process.env.GOOGLE_REDIRECT_URI);

// Google Auth Route (Redirect to Google)
googleAuth.get("/auth/google", async (c) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
  });

  return new Response("", {
    status: 302,
    headers: {
      Location: authUrl,
    },
  });
});

// Google Auth Callback Route
googleAuth.get("/auth/google/callback", async (c) => {
  try {
    const code = c.req.query("code");
    if (!code) {
      return c.json({ error: "Authorization code missing" }, 400);
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info
    const response = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      }
    );
    const profile = await response.json();

    if (!profile.email) {
      return c.json({ error: "Email not provided" }, 400);
    }

    // Find or create user
    let user = await User.findOne({ email: profile.email });

    if (!user) {
      user = new User({
        email: profile.email,
        firstName: profile.given_name || "Unknown",
        lastName: profile.family_name || "User",
        userType: "client",
        country: "Unknown",
        image: profile.picture,
        password: null,
      });

      await user.save();
    }

    // Generate JWT
    const token = await sign({ email: user.email, id: user._id }, process.env.JWT_SECRET!);
    
    return c.json({
      message: "Login successful",
      token,
      userType: user.userType,
      userId: user._id,
    }, 200);

  } catch (error) {
    console.error("Google auth error:", error);
    return c.json({ error: "Authentication failed" }, 401);
  }
});

// Update user profile
googleAuth.post("/auth/google/set-profile", async (c) => {
  try {
    // Extract Authorization header
    const authHeader = c.req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json({ error: "Authorization token is required" }, 401);
    }

    // Extract and verify token
    const token = authHeader.split(" ")[1];
    const tokenVerification = await verifyToken(token);
    if (tokenVerification.error) {
      return c.json({ error: tokenVerification.error }, 401);
    }

    // Extract userId from decoded token
    const { id: userId } = tokenVerification.decoded!;
    
    // Find user in the database
    const user = await User.findById(userId);
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    // Get request body
    const { userType, country } = await c.req.json();
    if (!userType || !country) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      userId, // Use userId directly
      { userType, country },
      { new: true }
    );

    if (!updatedUser) {
      return c.json({ error: "User update failed" }, 500);
    }

    return c.json({ message: "Profile updated successfully", user: updatedUser }, 200);
  } catch (error) {
    console.error(error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});



export default googleAuth;