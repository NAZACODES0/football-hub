import { apiGet } from "@/lib/api";
import type { Competition, Match } from "@/lib/types";
import { LeagueSwitcher } from "@/components/LeagueSwitcher";
import { MatchSection } from "@/components/MatchSection";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ league?: string }>;
}) {
  const { league } = await searchParams;

  const competitions = (await apiGet<Competition[]>("/api/competitions")) ?? [];
  const codes = competitions.map((c) => c.code).filter((c): c is string => !!c);
  const upper = league?.toUpperCase();
  const active = upper && codes.includes(upper) ? upper : undefined;

  const matchesUrl = (params: string[]) =>
    "/api/matches?" + [...params, ...(active ? [`competition=${active}`] : [])].join("&");

  const [live, today, upcoming, recent] = await Promise.all([
    apiGet<Match[]>("/api/matches/live"),
    apiGet<Match[]>(matchesUrl([])),
    apiGet<Match[]>(matchesUrl(["status=SCHEDULED", "limit=8"])),
    apiGet<Match[]>(matchesUrl(["status=FINISHED", "order=desc", "limit=8"])),
  ]);

  const liveNow = (live ?? []).filter((m) => !active || m.competition.code === active);

  return (
    <>
      <LeagueSwitcher competitions={competitions} active={active} />
      <MatchSection title="Live now" matches={liveNow} />
      <MatchSection title="Today's matches" matches={today ?? []} empty="No matches today." />
      <MatchSection title="Upcoming" matches={upcoming ?? []} />
      <MatchSection title="Recent results" matches={recent ?? []} />
    </>
  );
}
