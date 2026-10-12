import { redis } from "./redis";

// Drop cached copies of a match so the next request sees fresh data.
export async function invalidateMatch(id: number) {
  try {
    await redis.del("matches:live", `match:${id}`);
  } catch {
    // Redis down: the short cache TTLs will catch up on their own
  }
}
