import type { Broadcaster } from "@/lib/types";

export function WhereToWatch({ broadcasters }: { broadcasters: Broadcaster[] }) {
  const byCountry = new Map<string, Broadcaster[]>();
  for (const b of broadcasters) {
    byCountry.set(b.country, [...(byCountry.get(b.country) ?? []), b]);
  }

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-lg font-semibold">Where to watch</h2>
      {broadcasters.length === 0 ? (
        <p className="text-sm text-slate-400">No broadcaster information has been added yet.</p>
      ) : (
        <div className="space-y-3">
          {[...byCountry.entries()].map(([country, list]) => (
            <div key={country} className="rounded-lg border border-slate-800 bg-slate-900 p-3">
              <div className="mb-2 text-xs uppercase tracking-wide text-slate-400">{country}</div>
              <div className="flex flex-wrap gap-2">
                {list.map((b) => (
                  <a
                    key={b.id}
                    href={b.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded bg-slate-800 px-3 py-1.5 text-sm transition hover:bg-emerald-600"
                  >
                    {b.name}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="mt-2 text-xs text-slate-500">
        Links open the broadcasters&apos; own websites. Availability depends on your country.
      </p>
    </section>
  );
}
