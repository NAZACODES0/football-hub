import { redis } from "./redis";

// Returns cached JSON if present, otherwise runs the loader and stores the result.
// If Redis is unavailable, it falls back to the loader so the API keeps working.
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
): Promise<{ data: T; hit: boolean }> {
  try {
    const hit = await redis.get(key);
    if (hit !== null) return { data: JSON.parse(hit) as T, hit: true };
  } catch (err) {
    console.warn("Cache read failed:", (err as Error).message);
  }

  const data = await loader();

  try {
    await redis.set(key, JSON.stringify(data), "EX", ttlSeconds);
  } catch (err) {
    console.warn("Cache write failed:", (err as Error).message);
  }

  return { data, hit: false };
}
