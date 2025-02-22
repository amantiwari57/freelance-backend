import { Hono } from "hono";
import mongoose from "mongoose";
import { z } from "zod";
import { verifyToken } from "../../../helper/JwtHelpers/verifyToken";
import Job from "../../../models/job/jobModel";
import { JobMilestone } from "../../../models/job/jobMilestone/jobMilestoneModel";

const jobMilestoneRouter = new Hono();

// Milestone validation schema
const milestoneSchema = z.object({
  description: z.string().min(5),
  dueDate: z.string(),
  price: z.number().min(1),
});

// Create a milestone
jobMilestoneRouter.post("/job/:jobId/milestone", async (c) => {
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

    const userId = tokenVerification.decoded!.id;

    const body = await c.req.json();
    const validation = milestoneSchema.safeParse(body);
    if (!validation.success) {
      return c.json({ error: validation.error.errors }, { status: 400 });
    }

    const jobId = c.req.param("jobId");

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return c.json({ error: "Invalid job ID" }, { status: 400 });
    }

    const { description, dueDate, price } = body;

    // Check if the job exists and belongs to the logged-in client
    const job = await Job.findById(jobId);
    if (!job) {
      return c.json({ error: "Job not found" }, { status: 404 });
    }

    // Ensure only the job owner (client) can create milestones
    if (job.userId.toString() !== userId) {
      return c.json({ error: "You are not authorized to add milestones for this job" }, { status: 403 });
    }

    // Ensure the job is using milestone-based fixed payments
    if (job.paymentType !== "fixed" || job.fixedPaymentType !== "milestone") {
      return c.json({ error: "Milestones can only be created for milestone-based fixed jobs" }, { status: 400 });
    }

    // Create a new milestone
    const newMilestone = new JobMilestone({
      jobId,
      description,
      dueDate: new Date(dueDate),
      price,
      status: "pending",
    });

    await newMilestone.save();

    // Push milestone ID into the job's milestone array
    job?.milestones?.push(newMilestone._id as mongoose.Types.ObjectId);
    await job.save();

    return c.json({
      message: "Milestone created successfully",
      milestone: newMilestone,
    });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : "Invalid request" },
      { status: 400 }
    );
  }
});
//update milestone
jobMilestoneRouter.put("/job/:jobId/milestone/:milestoneId", async (c) => {
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
      const { jobId, milestoneId } = c.req.param();
  
      if (!mongoose.Types.ObjectId.isValid(jobId) || !mongoose.Types.ObjectId.isValid(milestoneId)) {
        return c.json({ error: "Invalid job ID or milestone ID" }, { status: 400 });
      }
  
      const job = await Job.findById(jobId);
      if (!job) return c.json({ error: "Job not found" }, { status: 404 });
  
      if (job.userId.toString() !== userId) {
        return c.json({ error: "You are not authorized to edit milestones for this job" }, { status: 403 });
      }
  
      const milestone = await JobMilestone.findById(milestoneId);
      if (!milestone || milestone.jobId.toString() !== jobId) {
        return c.json({ error: "Milestone not found" }, { status: 404 });
      }
  
      const body = await c.req.json();
      const validation = milestoneSchema.safeParse(body);
      if (!validation.success) {
        return c.json({ error: validation.error.errors }, { status: 400 });
      }
  
      const { description, dueDate, price } = body;
  
      milestone.description = description;
      milestone.dueDate = new Date(dueDate);
      milestone.price = price;
  
      await milestone.save();
  
      return c.json({ message: "Milestone updated successfully", milestone });
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Invalid request" }, { status: 400 });
    }
  });

  // Delete a milestone
  jobMilestoneRouter.delete("/job/:jobId/milestone/:milestoneId", async (c) => {
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
      const { jobId, milestoneId } = c.req.param();
  
      if (!mongoose.Types.ObjectId.isValid(jobId) || !mongoose.Types.ObjectId.isValid(milestoneId)) {
        return c.json({ error: "Invalid job ID or milestone ID" }, { status: 400 });
      }
  
      const job = await Job.findById(jobId);
      if (!job) return c.json({ error: "Job not found" }, { status: 404 });
  
      if (job.userId.toString() !== userId) {
        return c.json({ error: "You are not authorized to delete milestones for this job" }, { status: 403 });
      }
  
      const milestone = await JobMilestone.findById(milestoneId);
      if (!milestone || milestone.jobId.toString() !== jobId) {
        return c.json({ error: "Milestone not found" }, { status: 404 });
      }
  
      // Remove milestone from the job's milestones array
      job.milestones = job.milestones?.filter(
        (id) => id.toString() !== milestoneId
      );
  
      await job.save();
      await milestone.deleteOne();
  
      return c.json({ message: "Milestone deleted successfully" });
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Invalid request" }, { status: 400 });
    }
  });
  

export default jobMilestoneRouter;
