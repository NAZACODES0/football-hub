import dotenv from "dotenv";
import Redis from "ioredis";

dotenv.config({ path: "../../.env" });

export const redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false, // fail fast if Redis is down instead of hanging
});

redis.on("error", (err) => {
  console.error("Redis error:", err.message);
});
