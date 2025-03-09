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
import { consumer } from "../kafka/kafka";
import messageRouter from "./messages/messages";
import { saveMessageToDB } from "../kafka/saveMessageToDb";

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
  upgradeWebSocket(() => ({
    onOpen(_, ws) {
      const rawWs = ws.raw as ServerWebSocket;
      rawWs.subscribe(topic);
      activeSockets.add(rawWs);
      console.log(`WebSocket connected to topic '${topic}'`);
    },
    onClose(_, ws) {
      const rawWs = ws.raw as ServerWebSocket;
      rawWs.unsubscribe(topic);
      activeSockets.delete(rawWs);
      console.log(`WebSocket disconnected from '${topic}'`);
    },
  }))
);

// Kafka Consumer for WebSocket Notifications
const sendRealTimeUpdates = async () => {
  await consumer.connect();
  // console.log("kafka consumer connectd")
  await consumer.subscribe({ topic: "message", fromBeginning: false });
  const logger = {
    info: (msg: string, meta?: any) => console.log(`[INFO] ${msg}`, meta || ""),
    error: (msg: string, meta?: any) =>
      console.error(`[ERROR] ${msg}`, meta || ""),
  };
  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        if (!message.value) return;

        const msg = JSON.parse(message.value.toString());
        console.log("📥 Received message:", msg);

        const savedMessage = await saveMessageToDB(msg);
        console.log("📥 Saved message to DB", savedMessage);

        // Broadcast message to all active WebSockets
        activeSockets.forEach((ws) => {
          ws.send(JSON.stringify(msg));
        });

        console.log("✅ Sent real-time update via WebSocket");
      } catch (error) {
        console.error("❌ Error processing message:", error);
      }
    },
  });
};

sendRealTimeUpdates().catch(console.error);

// WebSocket Route

// Start Server
const server = Bun.serve({
  fetch: app.fetch,
  port: 3000,
  websocket,
});
console.log(`Server running at http://localhost:${server.port}`);
