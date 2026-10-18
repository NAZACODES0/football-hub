import { syncCompetition } from "./syncCompetition";

// Syncs each competition in turn. One failing league does not stop the others.
export async function syncAll(codes: string[]) {
  const failed: string[] = [];

  for (const code of codes) {
    try {
      console.log(`Syncing ${code}...`);
      const result = await syncCompetition(code);
      console.log(
        `Synced ${result.competition} (season ${result.season}): ` +
          `${result.standings} standings rows, ${result.matches} matches`,
      );
    } catch (e) {
      failed.push(code);
      console.error(`Sync failed for ${code}:`, (e as Error).message);
    }
  }

  if (failed.length > 0) {
    throw new Error(`These competitions failed to sync: ${failed.join(", ")}`);
  }
}
