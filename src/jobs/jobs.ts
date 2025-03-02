import { Hono } from "hono";
import Job from "../../models/job/jobModel";
import { verifyToken } from "../../helper/JwtHelpers/verifyToken";
import jobSchema from "./jobTypes";
import User from "../../models/user/userModel";
import JobStats from "../../models/jobStats/jobStatsModel";
import Profile from "../../models/profile/profileModel";

const jobRouter = new Hono();

const updateJobStats = async (userId: string) => {
  let jobStats = await JobStats.findOne({ userId });
  if (!jobStats) {
    jobStats = new JobStats({
      userId,
      totalJobs: 1,
      hireRate: 0,
      openJobs: 1,
      totalSpent: "$0",
      hires: 0,
      activeJobs: 0,
      avgHourlyRate: 0,
      totalHours: 0,
    });
  } else {
    jobStats.totalJobs += 1;
    jobStats.openJobs += 1;
    jobStats.hireRate =
      jobStats.totalJobs > 0 ? (jobStats.hires / jobStats.totalJobs) * 100 : 0;
    jobStats.totalSpent = `$${(
      jobStats.hires *
      jobStats.avgHourlyRate *
      jobStats.totalHours
    ).toFixed(2)}`;
  }
  await jobStats.save();
};

// Create Job
jobRouter.post("/jobs", async (c) => {
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
    const user = await User.findById(userId);
    if (!user) {
      return c.json({ error: "User not found" }, { status: 404 });
    }

    const body = await c.req.json();
    const parsedBody = jobSchema.parse(body);
    
    const newJob = new Job({
      userId,
      userType: user.userType,
      isOpen: true,
      ...parsedBody,
    });
    await newJob.save();

    // Update totalJobs in JobStats
    await updateJobStats(userId);

    return c.json(
      { message: "Job created successfully", job: newJob },
      { status: 201 }
    );
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : "Invalid request" },
      { status: 400 }
    );
  }
});

// Get Jobs
jobRouter.get("/jobs", async (c) => {
  try {
    const jobs = await Job.find();
    return c.json({ jobs }, { status: 200 });
  } catch (error) {
    return c.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }
});
// Get Job by ID
jobRouter.get("/jobs/:id", async (c) => {
  try {
    const job = await Job.findById(c.req.param("id")).populate("milestones");

    if (!job) {
      return c.json({ error: "Job not found" }, { status: 404 });
    }

    return c.json({ job });
  } catch (error) {
    return c.json({ error: "Invalid job ID" }, { status: 400 });
  }
});
// Update Job
jobRouter.put("/jobs/:id", async (c) => {
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

    const job = await Job.findById(c.req.param("id"));
    if (!job) return c.json({ error: "Job not found" }, { status: 404 });
    if (job.userId.toString() !== userId) {
      return c.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await c.req.json();
    const parsedBody = jobSchema.partial().parse(body);

    Object.assign(job, parsedBody);
    await job.save();
    return c.json({ message: "Job updated successfully", job });
  } catch (error) {
    return c.json({ error: "Failed to update job" }, { status: 400 });
  }
});

// Delete Job
jobRouter.delete("/jobs/:id", async (c) => {
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

    const user = await User.findById(userId);
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    const job = await Job.findById(c.req.param("id"));
    if (!job) return c.json({ error: "Job not found" }, { status: 404 });
    if (job.userId.toString() !== userId || user.isAdmin) {
      return c.json({ error: "Unauthorized" }, { status: 403 });
    }

    await job.deleteOne();
    return c.json({ message: "Job deleted successfully" });
  } catch (error) {
    return c.json({ error: "Failed to delete job" }, { status: 400 });
  }
});
jobRouter.get("/freelancer/best-matches", async (c) => {
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

    const { id: freelancerId } = tokenVerification.decoded!;
    const freelancerProfile = await Profile.findOne({ userId: freelancerId });

    if (!freelancerProfile) {
      return c.json({ error: "Freelancer profile not found" }, { status: 404 });
    }

    const freelancerSkills = freelancerProfile.skills || [];
    if (freelancerSkills.length === 0) {
      return c.json({ error: "No skills found in profile" }, { status: 400 });
    }

    // Find jobs that match at least one of the freelancer's skills
    const matchedJobs = await Job.find({
      skillsRequired: { $in: freelancerSkills },
      isOpen: true,
    });

    // Rank jobs based on the number of matching skills
    const rankedJobs = matchedJobs
      .map((job) => ({
        job,
        matchCount: job.skills.filter((skill) => freelancerSkills.includes(skill)).length,
      }))
      .sort((a, b) => b.matchCount - a.matchCount); // Sort by most matches

    return c.json({ matches: rankedJobs.map((item) => item.job) }, { status: 200 });
  } catch (error) {
    return c.json({ error: "Failed to fetch best matches" }, { status: 500 });
  }
});


export default jobRouter;
