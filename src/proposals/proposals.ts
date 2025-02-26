
import { Hono } from "hono";
import { verifyToken } from "../../helper/JwtHelpers/verifyToken";
import { Proposal } from "../../models/proposals/proposalModel";
import ProposalSchema from "./proposalTypes";
import Job from "../../models/job/jobModel";
import { deductProposal, reassignProposal } from "../../helper/accountHandler/accountHandler";

const proposalRouter= new Hono()

const calculateTimeDifference = (createdAt: Date): number => {
  const currentTime = new Date();
  return (currentTime.getTime() - createdAt.getTime()) / (1000 * 60 * 60); // Convert ms to hours
};

proposalRouter.get("/proposal/:id", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json(
        { error: "Authorization token is required" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    const tokenVerification = await verifyToken(token);
    if (tokenVerification.error) {
      return c.json({ error: tokenVerification.error }, { status: 401 });
    }

    const { id: userId } = tokenVerification.decoded!;
    const { id } = c.req.param();

    // Find the proposal
    const proposal = await Proposal.findById(id);
    if (!proposal) {
      return c.json({ error: "Proposal not found" }, { status: 404 });
    }

    // Check if the requester is either the job owner (client) or freelancer
    const isFreelancer = proposal.freelancerId.toString() === userId;
    const isClient = proposal.clientId.toString() === userId;

    if (!isFreelancer && !isClient) {
      return c.json({ error: "Unauthorized access" }, { status: 403 });
    }

    // Track the user who viewed it


    // Update the status to "viewed" only if the **client** (job owner) sees it
    if (isClient && proposal.status === "pending") {
      proposal.status = "viewed";
    }

    await proposal.save();

    return c.json({ proposal }, { status: 200 });
  } catch (error) {
    return c.json({ error: "Error fetching proposal" }, { status: 500 });
  }
});


proposalRouter.post("/proposal/:jobId", async (c) => {
  try {
    // Check Authorization
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
    const { jobId } = c.req.param();

    // Validate request body
    const body = await c.req.json();
    const parsedBody = ProposalSchema.safeParse(body);
    if (!parsedBody.success) {
      return c.json({ error: parsedBody.error.format() }, { status: 400 });
    }

    const { coverLetter, estimatedTime, proposalType, totalPrice,milestones } = parsedBody.data;

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return c.json({ error: "Job not found" }, { status: 404 });
    }

    // Prevent duplicate proposals by the same freelancer
    const existingProposal = await Proposal.findOne({ jobId, freelancerId: userId });
    if (existingProposal) {
      return c.json({ error: "You have already submitted a proposal for this job" }, { status: 400 });
    }

    // Deduct one proposal before creating the proposal
    const deductionResult = await deductProposal(userId);
    if (deductionResult !== true) {
      return c.json({ error: deductionResult }, { status: 403 });
    }

    // Create proposal
    const newProposal = new Proposal({
      jobId,
      freelancerId: userId,
      clientId: job.userId, // Assuming job has a clientId field
      coverLetter,
      estimatedTime,
      proposalType,
      totalPrice,
      milestones,
      status: "pending",
    });

    await newProposal.save();

    return c.json(
      { message: "Proposal submitted successfully", proposal: newProposal },
      { status: 201 }
    );
  } catch (error) {
    return c.json({ error: "Error submitting proposal" }, { status: 500 });
  }
});
//put proposal

proposalRouter.put("/proposal/:proposalId", async (c) => {
  try {
    // Check Authorization
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
    const { proposalId } = c.req.param();

    // Validate request body
    const body = await c.req.json();
    const parsedBody = ProposalSchema.safeParse(body);
    if (!parsedBody.success) {
      return c.json({ error: parsedBody.error.format() }, { status: 400 });
    }

    const { coverLetter, estimatedTime, proposalType, totalPrice } = parsedBody.data;

    // Find the proposal
    const proposal = await Proposal.findById(proposalId);
    if (!proposal) {
      return c.json({ error: "Proposal not found" }, { status: 404 });
    }

    // Check if the freelancer owns the proposal
    if (proposal.freelancerId.toString() !== userId) {
      return c.json({ error: "Unauthorized: You can only update your own proposals" }, { status: 403 });
    }

    // Calculate time difference
    const timeDiffInHours = calculateTimeDifference(proposal.createdAt);

    if (timeDiffInHours > 6) {
      // Deduct one proposal if updated after 6 hours
      const deductionResult = await deductProposal(userId);
      if (deductionResult !== true) {
        return c.json({ error: deductionResult }, { status: 403 });
      }
    }

    // Update proposal
    proposal.coverLetter = coverLetter;
    proposal.estimatedTime = estimatedTime;
    // proposal.proposalType = proposalType;
    // proposal.milestones = proposalType === "milestones" ? milestones : [];
    proposal.totalPrice = totalPrice;

    await proposal.save();

    return c.json({ message: "Proposal updated successfully", proposal }, { status: 200 });
  } catch (error) {
    return c.json({ error: "Error updating proposal" }, { status: 500 });
  }
});

proposalRouter.delete("/proposal/:proposalId", async (c) => {
  try {
    // Check Authorization
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
    const { proposalId } = c.req.param();

    // Find the proposal
    const proposal = await Proposal.findById(proposalId);
    if (!proposal) {
      return c.json({ error: "Proposal not found" }, { status: 404 });
    }

    // Check if the freelancer owns the proposal
    if (proposal.freelancerId.toString() !== userId) {
      return c.json({ error: "Unauthorized: You can only delete your own proposals" }, { status: 403 });
    }

    // Calculate time difference
    const timeDiffInHours = calculateTimeDifference(proposal.createdAt);

    // Soft delete the proposal
    // proposal.deleted = true;
    proposal.status = "withdrawn"; // Set status to withdrawn
    await proposal.save();

    if (timeDiffInHours < 6) {
      // Reassign proposal count if deleted within 6 hours
      const reassignResult = await reassignProposal(userId);
      if (reassignResult !== true) {
        return c.json({ error: reassignResult }, { status: 500 });
      }
    }

    return c.json({ message: "Proposal withdrawn successfully" }, { status: 200 });
  } catch (error) {
    return c.json({ error: "Error withdrawing proposal" }, { status: 500 });
  }
});




export default proposalRouter;