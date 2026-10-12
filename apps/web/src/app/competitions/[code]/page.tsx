import { notFound } from "next/navigation";
import { apiGet } from "@/lib/api";
import type { Match, StandingsResponse } from "@/lib/types";
import { Crest } from "@/components/Crest";
import { MatchSection } from "@/components/MatchSection";

export default async function CompetitionPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const upper = encodeURIComponent(code.toUpperCase());

  const [data, upcoming, recent] = await Promise.all([
    apiGet<StandingsResponse>(`/api/competitions/${upper}/standings`),
    apiGet<Match[]>(`/api/matches?competition=${upper}&status=SCHEDULED&limit=6`),
    apiGet<Match[]>(`/api/matches?competition=${upper}&status=FINISHED&order=desc&limit=6`),
  ]);
  if (!data) notFound();

  const th = "px-3 py-2";

  return (
    <>
      <h1 className="mb-1 text-2xl font-bold">{data.competition.name}</h1>
      <p className="mb-4 text-sm text-slate-400">
        {data.season
          ? `Season ${data.season}/${String(data.season + 1).slice(2)}`
          : "No standings yet"}
      </p>

      <div className="mb-8 overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-left text-xs uppercase text-slate-400">
            <tr>
              <th className={th}>#</th>
              <th className={th}>Team</th>
              <th className={th}>P</th>
              <th className={th}>W</th>
              <th className={th}>D</th>
              <th className={th}>L</th>
              <th className={th}>GF</th>
              <th className={th}>GA</th>
              <th className={th}>GD</th>
              <th className={th}>Pts</th>
            </tr>
          </thead>
          <tbody>
            {data.table.map((row) => {
              const gd = row.goalsFor - row.goalsAgainst;
              return (
                <tr key={row.id} className="border-t border-slate-800">
                  <td className="px-3 py-2 text-slate-400">{row.position}</td>
                  <td className="px-3 py-2">
                    <span className="flex items-center gap-2">
                      <Crest src={row.team.crestUrl} alt={row.team.name} size={22} />
                      <span className="font-medium">{row.team.shortName ?? row.team.name}</span>
                    </span>
                  </td>
                  <td className="px-3 py-2">{row.played}</td>
                  <td className="px-3 py-2">{row.won}</td>
                  <td className="px-3 py-2">{row.drawn}</td>
                  <td className="px-3 py-2">{row.lost}</td>
                  <td className="px-3 py-2">{row.goalsFor}</td>
                  <td className="px-3 py-2">{row.goalsAgainst}</td>
                  <td className="px-3 py-2">{gd > 0 ? `+${gd}` : gd}</td>
                  <td className="px-3 py-2 font-bold">{row.points}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <MatchSection title="Recent results" matches={recent ?? []} />
      <MatchSection title="Upcoming" matches={upcoming ?? []} />
    </>
  );
}
