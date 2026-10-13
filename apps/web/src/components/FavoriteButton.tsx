"use client";

import { useFavorites, type FavoriteTeam } from "@/lib/favorites";

export function FavoriteButton({ team }: { team: FavoriteTeam }) {
  const { isFavorite, toggle } = useFavorites();
  const active = isFavorite(team.id);

  return (
    <button
      onClick={() => toggle(team)}
      aria-pressed={active}
      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
        active
          ? "border-amber-400 bg-amber-400/10 text-amber-300"
          : "border-slate-600 text-slate-300 hover:border-amber-400 hover:text-amber-300"
      }`}
    >
      {active ? "\u2605 Favorited" : "\u2606 Add to favorites"}
    </button>
  );
}
