import { apiGet } from "@/lib/api";
import type { Match } from "@/lib/types";
import { MatchSection } from "@/components/MatchSection";

export default async function HomePage() {
  const [live, today, upcoming, recent] = await Promise.all([
    apiGet<Match[]>("/api/matches/live"),
    apiGet<Match[]>("/api/matches"),
    apiGet<Match[]>("/api/matches?status=SCHEDULED&limit=8"),
    apiGet<Match[]>("/api/matches?status=FINISHED&order=desc&limit=8"),
  ]);

  return (
    <>
      <MatchSection title="Live now" matches={live ?? []} />
      <MatchSection title="Today's matches" matches={today ?? []} empty="No matches today." />
      <MatchSection title="Upcoming" matches={upcoming ?? []} />
      <MatchSection title="Recent results" matches={recent ?? []} />
    </>
  );
}
