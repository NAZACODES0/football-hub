import Link from "next/link";
import { notFound } from "next/navigation";
import { apiGet } from "@/lib/api";
import type { Match, TeamDetail } from "@/lib/types";
import { Crest } from "@/components/Crest";
import { FavoriteButton } from "@/components/FavoriteButton";
import { MatchSection } from "@/components/MatchSection";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-3 text-center">
      <div className="text-xs uppercase text-slate-400">{label}</div>
      <div className="mt-1 text-xl font-bold tabular-nums">{value}</div>
    </div>
  );
}

export default async function TeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  const [team, upcoming, recent] = await Promise.all([
    apiGet<TeamDetail>(`/api/teams/${id}`),
    apiGet<Match[]>(`/api/matches?team=${id}&status=SCHEDULED&limit=5`),
    apiGet<Match[]>(`/api/matches?team=${id}&status=FINISHED&order=desc&limit=5`),
  ]);
  if (!team) notFound();

  const standing = team.standings[0];
  const gd = standing ? standing.goalsFor - standing.goalsAgainst : 0;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Crest src={team.crestUrl} alt={team.name} size={72} />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold">{team.name}</h1>
          {standing ? (
            <p className="text-sm text-slate-400">
              {standing.competition.code ? (
                <Link
                  href={`/competitions/${standing.competition.code}`}
                  className="hover:text-white"
                >
                  {standing.competition.name}
                </Link>
              ) : (
                standing.competition.name
              )}{" "}
              &middot; Season {standing.season}/{String(standing.season + 1).slice(2)}
            </p>
          ) : null}
        </div>
        <FavoriteButton
          team={{
            id: team.id,
            name: team.name,
            shortName: team.shortName,
            crestUrl: team.crestUrl,
          }}
        />
      </div>

      {standing ? (
        <div className="mb-8 grid grid-cols-3 gap-3 sm:grid-cols-5">
          <Stat label="Position" value={standing.position} />
          <Stat label="Played" value={standing.played} />
          <Stat label="W-D-L" value={`${standing.won}-${standing.drawn}-${standing.lost}`} />
          <Stat label="Goal diff" value={gd > 0 ? `+${gd}` : gd} />
          <Stat label="Points" value={standing.points} />
        </div>
      ) : null}

      <MatchSection title="Upcoming matches" matches={upcoming ?? []} empty="No upcoming matches." />
      <MatchSection title="Recent results" matches={recent ?? []} empty="No results yet." />
    </>
  );
}
