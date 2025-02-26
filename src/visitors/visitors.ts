import { Context, Hono } from "hono";
import visitorsModel from "../../models/visitors/visitorsModel";
import { getConnInfo } from 'hono/bun'
const visitorRouter = new Hono();

// Record a new visit

visitorRouter.post("/", async (c) => {
    try {
      // Get IP from headers first (for proxy support)
      let ip =
        c.req.header("X-Forwarded-For") || getConnInfo(c).remote.address || "Unknown";
  
      // If multiple IPs (comma-separated), take the first (real client IP)
      if (ip.includes(",")) {
        ip = ip.split(",")[0].trim();
      }
  
      const userAgent = c.req.header("User-Agent") || "Unknown";
  
      if (!ip || ip === "Unknown") {
        return c.json({ error: "Failed to retrieve IP address" }, 400);
      }
  
      await visitorsModel.create({ ip, userAgent });
  
      return c.json({ message: "Visit recorded successfully", ip, userAgent });
    } catch (error) {
      console.error(error);
      return c.json({ error: "Internal Server Error" }, 500);
    }
  });
  
// Get total visitor count
visitorRouter.get("/count", async (c) => {
  try {
    const visitorCount = await visitorsModel.countDocuments();
    return c.json({ totalVisitors: visitorCount });
  } catch (error) {
    console.error(error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

export default visitorRouter;
