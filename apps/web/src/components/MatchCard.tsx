"use client";

import Link from "next/link";
import type { Match } from "@/lib/types";
import { scoreText } from "@/lib/format";
import { useLiveMatch } from "@/lib/useLiveMatch";
import { Crest } from "./Crest";
import { StatusLabel } from "./StatusLabel";

export function MatchCard({ match: initial }: { match: Match }) {
  const match = useLiveMatch(initial);

  return (
    <Link
      href={`/matches/${match.id}`}
      className="block rounded-lg border border-slate-800 bg-slate-900 p-3 transition hover:border-emerald-500 sm:p-4"
    >
      <div className="mb-3 flex items-center justify-between gap-2 text-xs text-slate-400">
        <span className="truncate">{match.competition.name}</span>
        <StatusLabel match={match} />
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-3">
        <div className="flex min-w-0 items-center justify-end gap-2 text-right">
          <span className="truncate font-medium">
            {match.homeTeam.shortName ?? match.homeTeam.name}
          </span>
          <Crest src={match.homeTeam.crestUrl} alt={match.homeTeam.name} />
        </div>
        <div className="min-w-[3.5rem] text-center text-lg font-bold tabular-nums sm:min-w-[4rem] sm:text-xl">
          {scoreText(match)}
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <Crest src={match.awayTeam.crestUrl} alt={match.awayTeam.name} />
          <span className="truncate font-medium">
            {match.awayTeam.shortName ?? match.awayTeam.name}
          </span>
        </div>
      </div>
    </Link>
  );
}
