import { redis } from "../lib/redis";
import { syncCompetitionCodes } from "../lib/competitions";
import { syncAll } from "./syncAll";

const INTERVAL_MS = 12 * 60 * 60 * 1000; // twice a day
const FIRST_RUN_DELAY_MS = 15_000; // give Redis time to connect after a start
const LOCK_KEY = "sync:last-run";
const LOCK_TTL_SECONDS = 11 * 60 * 60;

// Only one sync per ~11 hours, even if the free server wakes up many times.
async function claimRun(): Promise<boolean> {
  try {
    const result = await redis.set(LOCK_KEY, new Date().toISOString(), "EX", LOCK_TTL_SECONDS, "NX");
    return result === "OK";
  } catch {
    return true; // Redis unavailable: sync anyway
  }
}

export function startScheduledSync() {
  const codes = syncCompetitionCodes();
  let running = false;

  const tick = async () => {
    if (running) return;
    running = true;
    try {
      if (!(await claimRun())) {
        console.log("Scheduled sync skipped: a sync ran recently");
        return;
      }
      try {
        await syncAll(codes);
        console.log("Scheduled sync finished at", new Date().toISOString());
      } catch (e) {
        await redis.del(LOCK_KEY).catch(() => undefined); // allow a retry later
        console.error("Scheduled sync failed:", (e as Error).message);
      }
    } finally {
      running = false;
    }
  };

  setTimeout(() => void tick(), FIRST_RUN_DELAY_MS);
  setInterval(() => void tick(), INTERVAL_MS);
  console.log(`Scheduled sync enabled for ${codes.join(", ")} (every 12 hours)`);
}
