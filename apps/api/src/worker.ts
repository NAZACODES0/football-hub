import { syncAll } from "./sync/syncAll";

const COMPETITIONS = ["PL"];
const INTERVAL_MS = 12 * 60 * 60 * 1000; // twice a day

async function tick() {
  try {
    await syncAll(COMPETITIONS);
    console.log("Sync finished at", new Date().toISOString());
  } catch (e) {
    console.error("Sync failed:", e);
  }
}

console.log(`Worker started. Syncing ${COMPETITIONS.join(", ")} every 12 hours.`);
void tick();
setInterval(tick, INTERVAL_MS);
