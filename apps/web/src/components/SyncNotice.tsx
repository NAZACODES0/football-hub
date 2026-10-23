"use client";

import Link from "next/link";
import { authClient } from "@/lib/authClient";

export function SyncNotice() {
  const { data: session, isPending } = authClient.useSession();
  if (isPending) return null;

  if (session) {
    return (
      <p className="mb-4 text-xs text-slate-500">
        Signed in: your favorites sync across your devices.
      </p>
    );
  }
  return (
    <p className="mb-4 text-sm text-slate-400">
      <Link href="/login" className="text-emerald-400 hover:underline">
        Sign in
      </Link>{" "}
      to keep your favorites on all your devices. Until then they are saved in this browser only.
    </p>
  );
}
