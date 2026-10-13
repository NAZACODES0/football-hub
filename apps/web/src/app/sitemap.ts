import type { MetadataRoute } from "next";
import { apiGet } from "@/lib/api";
import { SITE_URL } from "@/lib/site";
import type { Competition, Match, StandingsResponse } from "@/lib/types";

// Built from live data on every request, never frozen at build time.
export const dynamic = "force-dynamic";

async function safe<T, F>(task: Promise<T | null>, fallback: F): Promise<T | F> {
  try {
    return (await task) ?? fallback;
  } catch {
    return fallback;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE_URL.replace(/\/$/, "");

  const competitions = await safe(apiGet<Competition[]>("/api/competitions"), [] as Competition[]);
  const codes = competitions.map((c) => c.code).filter((c): c is string => !!c);

  const [standings, finished, upcoming] = await Promise.all([
    Promise.all(
      codes.map((code) => safe(apiGet<StandingsResponse>(`/api/competitions/${code}/standings`), null)),
    ),
    safe(apiGet<Match[]>("/api/matches?status=FINISHED&order=desc&limit=200"), [] as Match[]),
    safe(apiGet<Match[]>("/api/matches?status=SCHEDULED&limit=100"), [] as Match[]),
  ]);

  const teamIds = new Set<number>();
  for (const s of standings) {
    s?.table.forEach((row) => teamIds.add(row.team.id));
  }

  return [
    { url: `${base}/`, changeFrequency: "hourly" as const, priority: 1 },
    ...codes.map((code) => ({
      url: `${base}/competitions/${code}`,
      changeFrequency: "daily" as const,
      priority: 0.9,
    })),
    ...[...teamIds].map((id) => ({
      url: `${base}/teams/${id}`,
      changeFrequency: "daily" as const,
      priority: 0.6,
    })),
    ...[...finished, ...upcoming].map((m) => ({
      url: `${base}/matches/${m.id}`,
      lastModified: new Date(m.kickoffAt),
      changeFrequency: "daily" as const,
      priority: 0.5,
    })),
  ];
}
