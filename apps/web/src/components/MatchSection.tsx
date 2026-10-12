import type { Match } from "@/lib/types";
import { MatchCard } from "./MatchCard";

export function MatchSection({
  title,
  matches,
  empty,
}: {
  title: string;
  matches: Match[];
  empty?: string;
}) {
  if (matches.length === 0 && !empty) return null;
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      {matches.length === 0 ? (
        <p className="text-sm text-slate-400">{empty}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {matches.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>
      )}
    </section>
  );
}
