"use client";

import Link from "next/link";
import type { MatchDetail } from "@/lib/types";
import { formatKickoff, scoreText } from "@/lib/format";
import { useLiveMatch } from "@/lib/useLiveMatch";
import { Crest } from "./Crest";
import { StatusLabel } from "./StatusLabel";

export function Scoreboard({ match: initial }: { match: MatchDetail }) {
  const match = useLiveMatch(initial, `match:${initial.id}`);
  const { competition, homeTeam, awayTeam } = match;

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
      <div className="mb-4 flex items-center justify-between text-sm text-slate-400">
        {competition.code ? (
          <Link href={`/competitions/${competition.code}`} className="hover:text-white">
            {competition.name}
          </Link>
        ) : (
          <span>{competition.name}</span>
        )}
        <StatusLabel match={match} />
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <Crest src={homeTeam.crestUrl} alt={homeTeam.name} size={64} />
          <span className="font-semibold">{homeTeam.name}</span>
        </div>
        <div className="text-4xl font-bold tabular-nums">{scoreText(match)}</div>
        <div className="flex flex-col items-center gap-2 text-center">
          <Crest src={awayTeam.crestUrl} alt={awayTeam.name} size={64} />
          <span className="font-semibold">{awayTeam.name}</span>
        </div>
      </div>

      <p suppressHydrationWarning className="mt-4 text-center text-sm text-slate-400">
        {formatKickoff(match.kickoffAt)}
      </p>
    </div>
  );
}
