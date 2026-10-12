export function formatKickoff(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function scoreText(m: { homeScore: number | null; awayScore: number | null }): string {
  if (m.homeScore === null || m.awayScore === null) return "vs";
  return `${m.homeScore} - ${m.awayScore}`;
}
