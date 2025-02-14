import { Hono } from "hono";
import redis from "../../helper/redisClient";

const test = new Hono();

test.get("/test/redis", async (c) => {
  const cacheKey = "api:data"; // Unique cache key

  // Check if response is cached
  const cachedData = await redis.get(cacheKey);
  if (cachedData) {
    return c.json({ source: "cache", data: cachedData });
  }

  // Fetch data from database or external API
  const freshData = { message: "Hello, this is fresh data!" };

  // Store data in Redis with an expiry time (e.g., 60 seconds)
  await redis.set(cacheKey, JSON.stringify(freshData), { ex: 60 });

  return c.json({ source: "server", data: freshData });
});

export default test;
