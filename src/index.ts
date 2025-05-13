import { Hono } from "hono";
import signup from "./auth/signup";
import { cors } from "hono/cors";
import { connectDB } from "../helper/dbConnect";
import login from "./auth/login";
import googleAuth from "./auth/googleAuth";
import test from "./test/test";
import forgotPassword from "./auth/forgot-password";
import profile from "./profile/profile";
import upload from "./upload/upload";
import { createBunWebSocket } from "hono/bun";
import type { ServerWebSocket } from "bun";
import jobRouter from "./jobs/jobs";
import clientProfile from "./client/clientProfile";
import refreshTrackerRouter from "./refreshProposals/refreshProposals";
import proposalRouter from "./proposals/proposals";
import visitorRouter from "./visitors/visitors";
import agreementRouter from "./agreements/agreement";
import testCreateJob from "./testcontract/testContract";
import { MessageVerifyToken } from "../helper/JwtHelpers/kafkaVerifyToken";
import messageRouter, { authenticateKafka } from "./messages/messages";
import { subscriber, setupMessageHandler } from "../redis/redis";
import { saveMessageToDB } from "../redis/saveMessageToDb";

const app = new Hono();
connectDB();

// WebSocket Setup
const { upgradeWebSocket, websocket } = createBunWebSocket();
const topic = "message";

// Store active WebSocket connections
const activeSockets = new Set<ServerWebSocket>();

// ✅ Allow CORS with credentials (Important for authentication)
app.use(
  "/*",
  cors({
    origin: [
      "https://freelancer.vercel.app",
      "http://localhost:3000",
      "http://localhost:3001",
      "https://freelance-1-orpin.vercel.app",
    ],
    allowHeaders: ["Content-Type", "Authorization", "Credentials"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    maxAge: 86400,
  })
);

// Routes
app.route("/", signup);
app.route("/", login);
app.route("/", googleAuth);
app.route("/", test);
app.route("/", forgotPassword);
app.route("/", profile);
app.route("/", upload);
app.route("/", jobRouter);
app.route("/", clientProfile);
app.route("/", refreshTrackerRouter);
app.route("/", visitorRouter);
app.route("/", proposalRouter);
app.route("/agreements", agreementRouter);
app.route("/message", messageRouter);

app.get("/", (c) => {
  return c.html("<h1>Hello! Updated CORS policies allow frontend access!</h1>");
});

app.get(
  "/ws",
  upgradeWebSocket(async (c: any) => {
    const url = new URL(c.req.url, `http://${c.req.header("host")}`);
    const token = url.searchParams.get("token");

    return {
      async onOpen(_, ws) {
        try {
          if (!token) throw new Error("Missing token");
      
          const tokenVerification = await MessageVerifyToken(token);
          if (tokenVerification.error) {
            throw new Error(tokenVerification.error);
          }
      
          const userId = tokenVerification.decoded?.id;
          if (!userId) throw new Error("Invalid token");
      
          // ✅ Store userId in WebSocket instance
          const rawWs = ws.raw as ServerWebSocket & { userId?: string };
          rawWs.userId = userId; // Attach userId
      
          rawWs.subscribe(topic);
          activeSockets.add(rawWs);
          console.log(`✅ Authenticated WebSocket (user ${userId})`);
        } catch (error: any) {
          console.log("⚠️ WebSocket auth error:", error.message);
          ws.close(4003, error.message); // Close with policy violation code
        }
      },
      onClose(_, ws) {
        activeSockets.delete(ws.raw as ServerWebSocket);
        console.log("❌ WebSocket disconnected");
      },
    };
  })
);

// Redis Subscriber for WebSocket Notifications
setupMessageHandler(async (messageStr) => {
  try {
    const msg = JSON.parse(messageStr);
    console.log("📥 Received message:", msg);

    // Save message to database
    const savedMessage = await saveMessageToDB(msg);
    console.log("✅ Saved to DB:", savedMessage);

    // Send to relevant WebSocket connections
    activeSockets.forEach((ws) => {
      const typedWs = ws as ServerWebSocket & { userId?: string }; // Extend WebSocket type

      if (typedWs.userId === msg.receiverId || typedWs.userId === msg.senderId) {
        typedWs.send(JSON.stringify(msg));
      }
    });

    console.log("✅ Sent real-time update via WebSocket");
  } catch (error) {
    console.error("❌ Error processing message:", error);
  }
});

// Start Server
const server = Bun.serve({
  fetch: app.fetch,
  port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  websocket,
});
console.log(`Server running at http://localhost:${server.port}`);
