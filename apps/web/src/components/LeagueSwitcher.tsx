import Link from "next/link";
import type { Competition } from "@/lib/types";

export function LeagueSwitcher({
  competitions,
  active,
}: {
  competitions: Competition[];
  active?: string;
}) {
  if (competitions.length < 2) return null;

  const base = "rounded-full border px-3 py-1 text-sm transition";
  const on = "border-emerald-500 bg-emerald-500/10 text-emerald-300";
  const off = "border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white";

  return (
    <nav aria-label="League filter" className="mb-6 flex flex-wrap gap-2">
      <Link href="/" className={`${base} ${!active ? on : off}`}>
        All leagues
      </Link>
      {competitions
        .filter((c) => c.code)
        .map((c) => (
          <Link
            key={c.id}
            href={`/?league=${c.code}`}
            className={`${base} ${active === c.code ? on : off}`}
          >
            {c.name}
          </Link>
        ))}
    </nav>
  );
}
