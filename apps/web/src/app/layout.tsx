import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { apiGet } from "@/lib/api";
import { SITE_URL } from "@/lib/site";
import type { Competition } from "@/lib/types";
import { AuthButton } from "@/components/AuthButton";
import { FavoritesSync } from "@/components/FavoritesSync";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Football Hub", template: "%s | Football Hub" },
  description: "Live football scores, fixtures, standings and highlights.",
  openGraph: { siteName: "Football Hub", type: "website" },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let competitions: Competition[] = [];
  try {
    competitions = (await apiGet<Competition[]>("/api/competitions")) ?? [];
  } catch {
    // API is offline: the page itself will show the error
  }

  return (
    <html lang="en">
      <body>
        <FavoritesSync />
        <header className="border-b border-slate-800 bg-slate-900">
          <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
            <Link href="/" className="text-lg font-bold text-emerald-400">
              {"\u26BD"} Football Hub
            </Link>
            {competitions
              .filter((c) => c.code)
              .map((c) => (
                <Link
                  key={c.id}
                  href={`/competitions/${c.code}`}
                  className="text-sm text-slate-300 hover:text-white"
                >
                  {c.name}
                </Link>
              ))}
            <div className="ml-auto flex items-center gap-5">
              <Link href="/favorites" className="text-sm text-amber-300 hover:text-amber-200">
                {"\u2605"} Favorites
              </Link>
              <AuthButton />
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}

// Give the first request after the API has been asleep time to wait for it.
export const maxDuration = 60;
