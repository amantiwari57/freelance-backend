import { Hono } from "hono";
import { sign } from "hono/jwt";
import User from "../../models/user/userModel";
import { OAuth2Client } from "google-auth-library";

const googleAuth = new Hono();

// Initialize Google OAuth client
const oauth2Client = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI,
});

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
    const token = await sign({ email: user.email, id: user._id }, "secret");
    
    return c.json({
      message: "Login successful",
      token,
      userType: user.userType,
    }, 200);

  } catch (error) {
    console.error("Google auth error:", error);
    return c.json({ error: "Authentication failed" }, 401);
  }
});

// Update user profile
googleAuth.post("/auth/google/set-profile", async (c) => {
  try {
    const { email, userType, country } = await c.req.json();

    if (!email || !userType || !country) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    const user = await User.findOneAndUpdate(
      { email },
      { userType, country },
      { new: true }
    );

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json({ message: "Profile updated successfully", user }, 200);
  } catch (error) {
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

export default googleAuth;