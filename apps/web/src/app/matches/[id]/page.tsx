import { notFound } from "next/navigation";
import { apiGet } from "@/lib/api";
import type { MatchDetail } from "@/lib/types";
import { Scoreboard } from "@/components/Scoreboard";

const EVENT_ICONS: Record<string, string> = {
  GOAL: "\u26BD",
  OWN_GOAL: "\u26BD",
  PENALTY: "\u26BD",
  YELLOW_CARD: "\u{1F7E8}",
  RED_CARD: "\u{1F7E5}",
  SUBSTITUTION: "\u{1F501}",
};

const EVENT_LABELS: Record<string, string> = {
  GOAL: "Goal",
  OWN_GOAL: "Own goal",
  PENALTY: "Penalty",
  YELLOW_CARD: "Yellow card",
  RED_CARD: "Red card",
  SUBSTITUTION: "Substitution",
};

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  const match = await apiGet<MatchDetail>(`/api/matches/${id}`);
  if (!match) notFound();

  return (
    <>
      <Scoreboard match={match} />

      <h2 className="mb-3 mt-8 text-lg font-semibold">Match events</h2>
      {match.events.length === 0 ? (
        <p className="text-sm text-slate-400">
          No event timeline is available for this match. The free data plan does not include
          goals and cards.
        </p>
      ) : (
        <ul className="divide-y divide-slate-800 rounded-lg border border-slate-800">
          {match.events.map((e) => (
            <li key={e.id} className="flex items-center gap-3 px-4 py-2 text-sm">
              <span className="w-10 text-slate-400 tabular-nums">{e.minute}&apos;</span>
              <span>{EVENT_ICONS[e.type] ?? "\u2022"}</span>
              <span className="font-medium">{EVENT_LABELS[e.type] ?? e.type}</span>
              {e.playerName ? <span>{e.playerName}</span> : null}
              {e.team?.shortName ? (
                <span className="ml-auto text-slate-400">{e.team.shortName}</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
