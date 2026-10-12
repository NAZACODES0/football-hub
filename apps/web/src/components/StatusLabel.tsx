import type { Match } from "@/lib/types";
import { formatKickoff } from "@/lib/format";

export function StatusLabel({ match }: { match: Match }) {
  switch (match.status) {
    case "LIVE":
      return (
        <span className="rounded bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
          LIVE{match.minute ? ` ${match.minute}'` : ""}
        </span>
      );
    case "PAUSED":
      return (
        <span className="rounded bg-amber-600 px-2 py-0.5 text-xs font-bold text-white">
          BREAK
        </span>
      );
    case "FINISHED":
      return <span className="text-xs font-semibold text-slate-400">FT</span>;
    case "POSTPONED":
      return <span className="text-xs font-semibold text-amber-400">Postponed</span>;
    case "CANCELLED":
      return <span className="text-xs font-semibold text-red-400">Cancelled</span>;
    default:
      return (
        <span suppressHydrationWarning className="text-xs text-slate-400">
          {formatKickoff(match.kickoffAt)}
        </span>
      );
  }
}
