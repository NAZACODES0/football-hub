import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { apiGet } from "@/lib/api";
import type { Competition } from "@/lib/types";

export const metadata: Metadata = {
  title: "Football Hub",
  description: "Live scores, fixtures and standings",
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
        <header className="border-b border-slate-800 bg-slate-900">
          <nav className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3">
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
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
