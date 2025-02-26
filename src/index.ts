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
const app = new Hono();

connectDB();


app.use(
  "*",
  cors({
    origin: "*", // Allow all origins (Change this to specific domains in production)
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
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
app.get("/", (c) => {
  return c.html('<h1>Hello! Updated Cors policies allow from frontend!</h1>');
});

export default app;
