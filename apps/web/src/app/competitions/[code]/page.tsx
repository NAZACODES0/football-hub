import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { apiGet } from "@/lib/api";
import type { Match, StandingsResponse } from "@/lib/types";
import { Crest } from "@/components/Crest";
import { MatchSection } from "@/components/MatchSection";

const getStandings = cache((code: string) =>
  apiGet<StandingsResponse>(`/api/competitions/${encodeURIComponent(code.toUpperCase())}/standings`),
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const data = await getStandings(code);
  if (!data) return { title: "Competition not found" };

  const season = data.season ? ` ${data.season}/${String(data.season + 1).slice(2)}` : "";
  const title = `${data.competition.name} table${season}`;
  const description = `${data.competition.name} standings, results and upcoming fixtures.`;

  return {
    title,
    description,
    alternates: { canonical: `/competitions/${code.toUpperCase()}` },
    openGraph: { title, description },
  };
}

export default async function CompetitionPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const upper = encodeURIComponent(code.toUpperCase());

  const [data, upcoming, recent] = await Promise.all([
    getStandings(code),
    apiGet<Match[]>(`/api/matches?competition=${upper}&status=SCHEDULED&limit=6`),
    apiGet<Match[]>(`/api/matches?competition=${upper}&status=FINISHED&order=desc&limit=6`),
  ]);
  if (!data) notFound();

  const th = "px-2 py-2 sm:px-3";
  const td = "px-2 py-2 sm:px-3";
  const hideOnPhone = "hidden sm:table-cell";

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
              <th className={`${th} ${hideOnPhone}`}>GF</th>
              <th className={`${th} ${hideOnPhone}`}>GA</th>
              <th className={th}>GD</th>
              <th className={th}>Pts</th>
            </tr>
          </thead>
          <tbody>
            {data.table.map((row) => {
              const gd = row.goalsFor - row.goalsAgainst;
              return (
                <tr key={row.id} className="border-t border-slate-800">
                  <td className={`${td} text-slate-400`}>{row.position}</td>
                  <td className={td}>
                    <Link
                      href={`/teams/${row.team.id}`}
                      className="flex items-center gap-2 hover:text-emerald-400"
                    >
                      <Crest src={row.team.crestUrl} alt={row.team.name} size={22} />
                      <span className="font-medium">{row.team.shortName ?? row.team.name}</span>
                    </Link>
                  </td>
                  <td className={td}>{row.played}</td>
                  <td className={td}>{row.won}</td>
                  <td className={td}>{row.drawn}</td>
                  <td className={td}>{row.lost}</td>
                  <td className={`${td} ${hideOnPhone}`}>{row.goalsFor}</td>
                  <td className={`${td} ${hideOnPhone}`}>{row.goalsAgainst}</td>
                  <td className={td}>{gd > 0 ? `+${gd}` : gd}</td>
                  <td className={`${td} font-bold`}>{row.points}</td>
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

