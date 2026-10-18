import { redis } from "./redis";

// Drop cached copies of a match so the next request sees fresh data.
export async function invalidateMatch(id: number) {
  try {
    await redis.del("matches:live", `match:${id}`);
  } catch {
    // Redis down: the short cache TTLs will catch up on their own
  }
}

// After a sync, forget the cached league list and standings.
export async function invalidateCompetitionCaches() {
  try {
    const keys = [...(await redis.keys("competitions*")), ...(await redis.keys("standings:*"))];
    if (keys.length > 0) await redis.del(...keys);
  } catch {
    // Redis down: the cache TTLs will catch up on their own
  }
}
