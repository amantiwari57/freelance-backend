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
import jobRouter from "./jobs/jobs";
import clientProfile from "./client/clientProfile";
import refreshTrackerRouter from "./refreshProposals/refreshProposals";
// import jobMilestoneRouter from "./jobs/jobMilestone/jobMilestone";
// import proposalMilestoneRouter from "./proposals/proposalMilestone/proposalMilestone";
import proposalRouter from "./proposals/proposals";
import visitorRouter from "./visitors/visitors";
import agreementRouter from "./agreements/agreement";
import testCreateJob from "./testcontract/testContract";

const app = new Hono();

connectDB();


// ✅ Allow CORS with credentials (Important for authentication)
app.use(
  '/*',
  cors({
    origin: [
      'https://freelancer.vercel.app', 
      'http://localhost:3000',
      'http://localhost:3001',
      'https://freelance-1-orpin.vercel.app/'  // Add your frontend origin
    ],
    allowHeaders: [
      'Content-Type',
      'Authorization',
      'Credentials'
    ],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    maxAge: 86400,
  })
);
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
// testCreateJob()
app.get("/", (c) => {
  return c.html('<h1>Hello! Updated Cors policies allow from frontend!</h1>');
});

export default app;
