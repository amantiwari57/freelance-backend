import { Hono } from "hono";
import mongoose from "mongoose";
import { z } from "zod";
import { verifyToken } from "../../../helper/JwtHelpers/verifyToken";
import { Proposal } from "../../../models/proposals/proposalModel";
import { Milestone } from "../../../models/proposals/milestones/milestoneModel";

const proposalMilestoneRouter = new Hono();

// Validation schema for proposal milestone
const proposalMilestoneSchema = z.object({
  description: z.string().min(5),
  dueDate: z.string(),
  price: z.number().min(1),
});

// Create a milestone for a proposal
proposalMilestoneRouter.post("/proposal/:proposalId/milestone", async (c) => {
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
    const { proposalId } = c.req.param();
    const body = await c.req.json();

    if (!mongoose.Types.ObjectId.isValid(proposalId)) {
      return c.json({ error: "Invalid proposal ID" }, { status: 400 });
    }

    const proposal = await Proposal.findById(proposalId);
    if (!proposal)
      return c.json({ error: "Proposal not found" }, { status: 404 });

    if (proposal.freelancerId.toString() !== userId) {
      return c.json(
        { error: "You are not authorized to add milestones for this proposal" },
        { status: 403 }
      );
    }

    const validation = proposalMilestoneSchema.safeParse(body);
    if (!validation.success) {
      return c.json({ error: validation.error.errors }, { status: 400 });
    }

    const { description, dueDate, price } = body;
    const newMilestone = new Milestone({
      proposalId,
      description,
      dueDate: new Date(dueDate),
      price,
      status: "pending",
    });

    await newMilestone.save();
    await Proposal.findByIdAndUpdate(proposalId, {
      $push: { milestones: newMilestone._id },
    });

    return c.json({
      message: "Proposal milestone created successfully",
      milestone: newMilestone,
    });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : "Invalid request" },
      { status: 400 }
    );
  }
});

proposalMilestoneRouter.put(
  "/proposal/:proposalId/milestone/:milestoneId",
  async (c) => {
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
      const { proposalId, milestoneId } = c.req.param();
      const body = await c.req.json();

      if (
        !mongoose.Types.ObjectId.isValid(proposalId) ||
        !mongoose.Types.ObjectId.isValid(milestoneId)
      ) {
        return c.json(
          { error: "Invalid proposal ID or milestone ID" },
          { status: 400 }
        );
      }

      const proposal = await Proposal.findById(proposalId);
      if (!proposal)
        return c.json({ error: "Proposal not found" }, { status: 404 });

      if (proposal.freelancerId.toString() !== userId) {
        return c.json(
          {
            error:
              "You are not authorized to edit milestones for this proposal",
          },
          { status: 403 }
        );
      }

      const milestone = await Milestone.findById(milestoneId);
      if (!milestone || milestone.proposalId.toString() !== proposalId) {
        return c.json({ error: "Milestone not found" }, { status: 404 });
      }

      const validation = proposalMilestoneSchema.safeParse(body);
      if (!validation.success) {
        return c.json({ error: validation.error.errors }, { status: 400 });
      }

      const { description, dueDate, price } = body;
      milestone.description = description;
      milestone.dueDate = new Date(dueDate);
      milestone.price = price;

      await milestone.save();

      return c.json({
        message: "Proposal milestone updated successfully",
        milestone,
      });
    } catch (error) {
      return c.json(
        { error: error instanceof Error ? error.message : "Invalid request" },
        { status: 400 }
      );
    }
  }
);

proposalMilestoneRouter.delete(
  "/proposal/:proposalId/milestone/:milestoneId",
  async (c) => {
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
      const { proposalId, milestoneId } = c.req.param();

      if (
        !mongoose.Types.ObjectId.isValid(proposalId) ||
        !mongoose.Types.ObjectId.isValid(milestoneId)
      ) {
        return c.json(
          { error: "Invalid proposal ID or milestone ID" },
          { status: 400 }
        );
      }

      const proposal = await Proposal.findById(proposalId);
      if (!proposal)
        return c.json({ error: "Proposal not found" }, { status: 404 });

      if (proposal.freelancerId.toString() !== userId) {
        return c.json(
          {
            error:
              "You are not authorized to delete milestones for this proposal",
          },
          { status: 403 }
        );
      }

      const milestone = await Milestone.findById(milestoneId);
      if (!milestone || milestone.proposalId.toString() !== proposalId) {
        return c.json({ error: "Milestone not found" }, { status: 404 });
      }

      await milestone.deleteOne();

      return c.json({ message: "Proposal milestone deleted successfully" });
    } catch (error) {
      return c.json(
        { error: error instanceof Error ? error.message : "Invalid request" },
        { status: 400 }
      );
    }
  }
);

export default proposalMilestoneRouter;
