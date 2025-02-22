import { Hono } from "hono";
import { verifyToken } from "../../helper/JwtHelpers/verifyToken";
import User from "../../models/user/userModel";
import { ProposalRefreshTracker } from "../../models/monthlyProposalUpdate/monthlyProposalUpdateModel";
import { z } from "zod";

const proposalRefreshTrackerSchema = z.object({
  proposalsToRefresh: z.number().min(1, "proposalsToRefresh must be at least 1"),
});

const refreshTrackerRouter = new Hono();

// ✅ POST API: Create Proposal Refresh Tracker (Admin Only)
refreshTrackerRouter.post("/proposal-refresh", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json({ error: "Authorization token is required" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const tokenVerification = await verifyToken(token);
    if (tokenVerification.error) {
      return c.json({ error: tokenVerification.error }, { status: 401 });
    }

    const { id: userId } = tokenVerification.decoded!;
    const user = await User.findById(userId);

    if (!user || !user.isAdmin) {
      return c.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const body = await c.req.json();

    // ✅ Parse & validate request body
    let parsedBody;
    try {
      parsedBody = proposalRefreshTrackerSchema.parse(body);
    } catch (error:any) {
      return c.json({ error: error.errors }, { status: 400 });
    }

    const { proposalsToRefresh } = parsedBody;

    // Get the current month and year
    const currentDate = new Date();
    const month = currentDate.toLocaleString("en-US", { month: "short" }); // e.g., "Jan"
    const year = currentDate.getFullYear(); // e.g., 2025

    // Create a new Proposal Refresh Tracker entry
    const newTracker = new ProposalRefreshTracker({
      proposalsToRefresh,
      monthDetails: { month, year, proposalsProvided: proposalsToRefresh },
    });

    await newTracker.save();

    return c.json(
      { message: "Proposal refresh tracker created successfully", tracker: newTracker },
      { status: 201 }
    );
  } catch (error) {
    return c.json({ error: "Error creating proposal refresh tracker" }, { status: 500 });
  }
});

export default refreshTrackerRouter;
