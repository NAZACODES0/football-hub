import dotenv from "dotenv";

dotenv.config({ path: "../../.env" });

const BASE_URL = "https://api.football-data.org/v4";
const MIN_INTERVAL_MS = 6500; // free tier: about 10 requests per minute

export interface FdTeam {
  id: number;
  name: string;
  shortName: string | null;
  crest: string | null;
}

export interface FdCompetition {
  id: number;
  name: string;
  code: string;
  emblem: string | null;
  area?: { name: string };
}

export interface FdMatch {
  id: number;
  utcDate: string;
  status: string;
  homeTeam: FdTeam;
  awayTeam: FdTeam;
  score: { fullTime: { home: number | null; away: number | null } };
}

export interface FdStandingRow {
  position: number;
  team: FdTeam;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
}

export interface FdStandings {
  season: { startDate: string };
  standings: { type: string; table: FdStandingRow[] }[];
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Every request waits its turn so we never exceed the rate limit.
let lastRequestAt = 0;
let queue: Promise<unknown> = Promise.resolve();

function schedule<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const wait = lastRequestAt + MIN_INTERVAL_MS - Date.now();
    if (wait > 0) await sleep(wait);
    lastRequestAt = Date.now();
    return task();
  });
  queue = run.catch(() => undefined);
  return run;
}

async function request<T>(path: string, attempt = 1): Promise<T> {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey || apiKey === "your_key_here") {
    throw new Error("FOOTBALL_DATA_API_KEY is missing in .env");
  }

  const res = await schedule(() =>
    fetch(`${BASE_URL}${path}`, { headers: { "X-Auth-Token": apiKey } }),
  );

  if (res.status === 429 && attempt <= 2) {
    console.warn("Rate limited by football-data.org, waiting 60s...");
    await sleep(60_000);
    return request<T>(path, attempt + 1);
  }

  if (!res.ok) {
    throw new Error(`football-data.org ${res.status} for ${path}: ${await res.text()}`);
  }
  return (await res.json()) as T;
}

export const getCompetition = (code: string) =>
  request<FdCompetition>(`/competitions/${code}`);

export const getStandings = (code: string) =>
  request<FdStandings>(`/competitions/${code}/standings`);

export const getMatches = (code: string) =>
  request<{ matches: FdMatch[] }>(`/competitions/${code}/matches`);
