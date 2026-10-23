"use client";

import { useEffect } from "react";
import { authClient } from "@/lib/authClient";
import { MERGE_FLAG, fetchFavorites, mergeFavorites } from "@/lib/favoritesApi";
import { getLocalFavorites, replaceFavorites } from "@/lib/favorites";

// Keeps this browser's favorites in step with the signed-in account.
export function FavoritesSync() {
  const { data: session } = authClient.useSession();
  const userId = session?.user.id;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    async function sync() {
      let pending = false;
      try {
        pending = window.localStorage.getItem(MERGE_FLAG) === "1";
      } catch {
        // storage blocked
      }

      // Right after signing in: add this browser's favorites to the account.
      // Every other time: the account's list wins.
      const list = pending
        ? await mergeFavorites(getLocalFavorites().map((f) => f.id))
        : await fetchFavorites();

      if (!list || cancelled) return;
      replaceFavorites(list);
      if (pending) {
        try {
          window.localStorage.removeItem(MERGE_FLAG);
        } catch {
          // storage blocked
        }
      }
    }

    void sync();
    const onFocus = () => void sync(); // pick up changes made on another device
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
    };
  }, [userId]);

  return null;
}
