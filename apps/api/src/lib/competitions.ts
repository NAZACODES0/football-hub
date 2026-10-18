// Competitions to sync, from SYNC_COMPETITIONS (comma-separated football-data.org codes).
export function syncCompetitionCodes(): string[] {
  const raw = process.env.SYNC_COMPETITIONS ?? "PL";
  const codes = raw
    .split(",")
    .map((code) => code.trim().toUpperCase())
    .filter((code) => code.length > 0);
  return codes.length > 0 ? codes : ["PL"];
}
