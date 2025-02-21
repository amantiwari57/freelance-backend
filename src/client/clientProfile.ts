import { Hono } from "hono";
import ClientProfile from "../../models/client/clientModel";
import { verifyToken } from "../../helper/JwtHelpers/verifyToken";
import User from "../../models/user/userModel";
import { ClientProfileSchema } from "./clientTypes";
import JobStats from "../../models/jobStats/jobStatsModel";

const clientProfile = new Hono();

clientProfile.post("/client-profile", async (c, req) => {
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
    const parsedBody = ClientProfileSchema.parse(body);

    const newClientProfile = new ClientProfile({
      userId,
      userType: user.userType,
      ...parsedBody,
    });
    await newClientProfile.save();

    return c.json(
      {
        message: "Client profile created successfully",
        profile: newClientProfile,
      },
      { status: 201 }
    );
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : "Invalid request" },
      { status: 400 }
    );
  }
});
clientProfile.get("/client-profile/:userId", async (c) => {
  try {
    const { userId } = c.req.param();
    const profile = await ClientProfile.findOne({ userId });
    // .populate("reviews")
    // .populate("verification")
    // .populate("jobStats");
    if (!profile) {
      return c.json({ error: "Client profile not found" }, { status: 404 });
    }
    // const profile = await ClientProfile.findById(id);
    // if (!profile) {
    //   return c.json({ error: "Client profile not found" }, { status: 404 });
    // }
    const jobStats = await JobStats.findOne({ userId });
    if (!jobStats) {
      return c.json({ error: "Job stats not found" }, { status: 404 });
    }
    return c.json({ profile, jobStats }, { status: 200 });
  } catch (error) {
    return c.json({ error: "Error fetching profile" }, { status: 500 });
  }
});

// Update Client Profile
clientProfile.put("/client-profile/:id", async (c) => {
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

    const profile = await ClientProfile.findById(id);
    if (!profile) {
      return c.json({ error: "Client profile not found" }, { status: 404 });
    }

    if (profile.userId.toString() !== userId) {
      return c.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const body = await c.req.json();
    const parsedBody = ClientProfileSchema.partial().parse(body);

    const updatedProfile = await ClientProfile.findByIdAndUpdate(
      id,
      parsedBody,
      { new: true }
    );
    return c.json(
      { message: "Profile updated successfully", profile: updatedProfile },
      { status: 200 }
    );
  } catch (error) {
    return c.json({ error: "Error updating profile" }, { status: 500 });
  }
});

// Delete Client Profile
clientProfile.delete("/client-profile/:id", async (c) => {
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

    const profile = await ClientProfile.findById(id);
    if (!profile) {
      return c.json({ error: "Client profile not found" }, { status: 404 });
    }

    if (profile.userId.toString() !== userId) {
      return c.json({ error: "Unauthorized access" }, { status: 403 });
    }

    await ClientProfile.findByIdAndDelete(id);
    return c.json({ message: "Profile deleted successfully" }, { status: 200 });
  } catch (error) {
    return c.json({ error: "Error deleting profile" }, { status: 500 });
  }
});

export default clientProfile;
