"use client";

import Link from "next/link";
import { authClient } from "@/lib/authClient";
import { clearToken } from "@/lib/favoritesApi";
import { replaceFavorites } from "@/lib/favorites";

async function signOut() {
  await authClient.signOut();
  clearToken();
  replaceFavorites([]); // they live on your account, not on a shared browser
  window.location.assign("/");
}

export function AuthButton() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return <span className="inline-block w-16" />;

  if (!session) {
    return (
      <Link href="/login" className="text-sm text-slate-300 hover:text-white">
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="max-w-[9rem] truncate text-slate-400">{session.user.name}</span>
      <button onClick={() => void signOut()} className="text-slate-300 hover:text-white">
        Sign out
      </button>
    </div>
  );
}
