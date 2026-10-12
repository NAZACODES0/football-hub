import Link from "next/link";
import type { Match } from "@/lib/types";
import { scoreText } from "@/lib/format";
import { Crest } from "./Crest";
import { StatusLabel } from "./StatusLabel";

export function MatchCard({ match }: { match: Match }) {
  return (
    <Link
      href={`/matches/${match.id}`}
      className="block rounded-lg border border-slate-800 bg-slate-900 p-4 transition hover:border-emerald-500"
    >
      <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
        <span>{match.competition.name}</span>
        <StatusLabel match={match} />
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="flex items-center justify-end gap-2 text-right">
          <span className="font-medium">{match.homeTeam.shortName ?? match.homeTeam.name}</span>
          <Crest src={match.homeTeam.crestUrl} alt={match.homeTeam.name} />
        </div>
        <div className="min-w-[4rem] text-center text-xl font-bold tabular-nums">
          {scoreText(match)}
        </div>
        <div className="flex items-center gap-2">
          <Crest src={match.awayTeam.crestUrl} alt={match.awayTeam.name} />
          <span className="font-medium">{match.awayTeam.shortName ?? match.awayTeam.name}</span>
        </div>
      </div>
    </Link>
  );
}
