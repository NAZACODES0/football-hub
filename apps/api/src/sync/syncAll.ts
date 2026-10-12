import { syncCompetition } from "./syncCompetition";

export async function syncAll(codes: string[]) {
  for (const code of codes) {
    console.log(`Syncing ${code}...`);
    const result = await syncCompetition(code);
    console.log(
      `Synced ${result.competition} (season ${result.season}): ` +
        `${result.standings} standings rows, ${result.matches} matches`,
    );
  }
}
