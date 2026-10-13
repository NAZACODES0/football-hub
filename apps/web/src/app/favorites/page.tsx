"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import { useFavorites } from "@/lib/favorites";
import type { Match } from "@/lib/types";
import { Crest } from "@/components/Crest";
import { MatchSection } from "@/components/MatchSection";

export default function FavoritesPage() {
  const { favorites, toggle } = useFavorites();
  const [upcoming, setUpcoming] = useState<Match[]>([]);
  const [recent, setRecent] = useState<Match[]>([]);
  const ids = favorites.map((f) => f.id).join(",");

  useEffect(() => {
    if (!ids) return;
    let cancelled = false;

    Promise.all([
      apiGet<Match[]>(`/api/matches?team=${ids}&status=SCHEDULED&limit=10`),
      apiGet<Match[]>(`/api/matches?team=${ids}&status=FINISHED&order=desc&limit=10`),
    ])
      .then(([u, r]) => {
        if (cancelled) return;
        setUpcoming(u ?? []);
        setRecent(r ?? []);
      })
      .catch(() => {
        // API offline: leave the lists as they are
      });

    return () => {
      cancelled = true;
    };
  }, [ids]);

  return (
    <>
      <h1 className="mb-4 text-2xl font-bold">Favorites</h1>

      {favorites.length === 0 ? (
        <p className="text-slate-400">
          You have no favorite teams yet. Open a team page and press &quot;Add to favorites&quot;.
          Favorites are saved in this browser only.
        </p>
      ) : (
        <>
          <div className="mb-8 flex flex-wrap gap-2">
            {favorites.map((team) => (
              <div
                key={team.id}
                className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 py-1.5 pl-3 pr-2"
              >
                <Crest src={team.crestUrl} alt={team.name} size={20} />
                <Link href={`/teams/${team.id}`} className="text-sm font-medium hover:text-emerald-400">
                  {team.shortName ?? team.name}
                </Link>
                <button
                  onClick={() => toggle(team)}
                  aria-label={`Remove ${team.name} from favorites`}
                  className="rounded-full px-2 text-slate-400 hover:text-red-400"
                >
                  {"\u00D7"}
                </button>
              </div>
            ))}
          </div>

          <MatchSection title="Upcoming" matches={upcoming} empty="No upcoming matches." />
          <MatchSection title="Recent results" matches={recent} empty="No results yet." />
        </>
      )}
    </>
  );
}
