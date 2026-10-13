"use client";

import Link from "next/link";
import type { MatchDetail, Team } from "@/lib/types";
import { formatKickoff, scoreText } from "@/lib/format";
import { useLiveMatch } from "@/lib/useLiveMatch";
import { Crest } from "./Crest";
import { StatusLabel } from "./StatusLabel";

function TeamBlock({ team }: { team: Team }) {
  return (
    <Link
      href={`/teams/${team.id}`}
      className="flex min-w-0 flex-col items-center gap-2 text-center hover:text-emerald-400"
    >
      <Crest src={team.crestUrl} alt={team.name} size={56} />
      <span className="break-words text-sm font-semibold sm:text-base">{team.name}</span>
    </Link>
  );
}

export function Scoreboard({ match: initial }: { match: MatchDetail }) {
  const match = useLiveMatch(initial, `match:${initial.id}`);
  const { competition, homeTeam, awayTeam } = match;

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-2 text-sm text-slate-400">
        {competition.code ? (
          <Link href={`/competitions/${competition.code}`} className="hover:text-white">
            {competition.name}
          </Link>
        ) : (
          <span>{competition.name}</span>
        )}
        <StatusLabel match={match} />
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 sm:gap-4">
        <TeamBlock team={homeTeam} />
        <div className="text-3xl font-bold tabular-nums sm:text-4xl">{scoreText(match)}</div>
        <TeamBlock team={awayTeam} />
      </div>

      <p suppressHydrationWarning className="mt-4 text-center text-sm text-slate-400">
        {formatKickoff(match.kickoffAt)}
      </p>
    </div>
  );
}
