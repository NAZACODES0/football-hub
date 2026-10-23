import type { FavoriteTeam } from "./favorites";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const TOKEN_KEY = "bearer_token";

// Set by the login page so the first sync after signing in merges this browser's favorites.
export const MERGE_FLAG = "football-hub:merge-pending";

export function getToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function clearToken() {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // nothing to clear
  }
}

// Calls the API with the saved token. Returns null if signed out or the request failed.
async function call(path: string, init: RequestInit = {}): Promise<Response | null> {
  const token = getToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) {
      clearToken(); // the saved token is no longer valid
      return null;
    }
    return res;
  } catch {
    return null;
  }
}

export async function fetchFavorites(): Promise<FavoriteTeam[] | null> {
  const res = await call("/api/me/favorites");
  return res && res.ok ? ((await res.json()) as FavoriteTeam[]) : null;
}

export async function mergeFavorites(teamIds: number[]): Promise<FavoriteTeam[] | null> {
  const res = await call("/api/me/favorites/merge", {
    method: "POST",
    body: JSON.stringify({ teamIds }),
  });
  return res && res.ok ? ((await res.json()) as FavoriteTeam[]) : null;
}

export async function pushFavorite(teamId: number, add: boolean): Promise<void> {
  await call(`/api/me/favorites/${teamId}`, { method: add ? "PUT" : "DELETE" });
}
