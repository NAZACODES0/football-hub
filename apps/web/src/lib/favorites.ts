"use client";

import { useSyncExternalStore } from "react";
import { pushFavorite } from "./favoritesApi";

export interface FavoriteTeam {
  id: number;
  name: string;
  shortName: string | null;
  crestUrl: string | null;
}

const KEY = "football-hub:favorites";
const EMPTY: FavoriteTeam[] = [];
const listeners = new Set<() => void>();

let lastRaw: string | null = null;
let lastValue: FavoriteTeam[] = EMPTY;

function isTeam(value: unknown): value is FavoriteTeam {
  const v = value as Partial<FavoriteTeam> | null;
  return !!v && typeof v.id === "number" && typeof v.name === "string";
}

// Returns the same array object until the stored text changes (React needs that).
function read(): FavoriteTeam[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return lastValue;
  }
  if (raw === lastRaw) return lastValue;

  lastRaw = raw;
  try {
    const parsed: unknown = JSON.parse(raw ?? "[]");
    lastValue = Array.isArray(parsed) ? parsed.filter(isTeam) : EMPTY;
  } catch {
    lastValue = EMPTY;
  }
  return lastValue;
}

function write(next: FavoriteTeam[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage unavailable (private mode, blocked): nothing to save
  }
  listeners.forEach((listener) => listener());
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  window.addEventListener("storage", callback); // changes made in another tab
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

// Used by the sync code and by sign-out.
export function getLocalFavorites(): FavoriteTeam[] {
  return read();
}

export function replaceFavorites(next: FavoriteTeam[]) {
  write(next);
}

export function useFavorites() {
  const favorites = useSyncExternalStore(subscribe, read, () => EMPTY);

  return {
    favorites,
    isFavorite: (id: number) => favorites.some((f) => f.id === id),
    toggle: (team: FavoriteTeam) => {
      const current = read();
      const wasFavorite = current.some((f) => f.id === team.id);
      write(wasFavorite ? current.filter((f) => f.id !== team.id) : [...current, team]);
      void pushFavorite(team.id, !wasFavorite); // does nothing if signed out
    },
  };
}
