import { syncAll } from "./sync/syncAll";
import { syncCompetitionCodes } from "./lib/competitions";

const INTERVAL_MS = 12 * 60 * 60 * 1000; // twice a day

async function tick() {
  try {
    await syncAll(syncCompetitionCodes());
    console.log("Sync finished at", new Date().toISOString());
  } catch (e) {
    console.error("Sync failed:", e);
  }
}

console.log("Worker started. Syncing every 12 hours.");
void tick();
setInterval(tick, INTERVAL_MS);
