import { syncAll } from "./syncAll";

const INTERVAL_MS = 12 * 60 * 60 * 1000; // twice a day

// Runs a sync on start (this also fills an empty database) and then every 12 hours.
export function startScheduledSync(codes: string[] = ["PL"]) {
  let running = false;

  const tick = async () => {
    if (running) return;
    running = true;
    try {
      await syncAll(codes);
      console.log("Scheduled sync finished at", new Date().toISOString());
    } catch (e) {
      console.error("Scheduled sync failed:", (e as Error).message);
    } finally {
      running = false;
    }
  };

  void tick();
  setInterval(tick, INTERVAL_MS);
  console.log(`Scheduled sync enabled for ${codes.join(", ")} (every 12 hours)`);
}
