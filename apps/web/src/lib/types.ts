export type MatchStatus =
  | "SCHEDULED"
  | "LIVE"
  | "PAUSED"
  | "FINISHED"
  | "POSTPONED"
  | "CANCELLED";

export interface Team {
  id: number;
  name: string;
  shortName: string | null;
  crestUrl: string | null;
}

export interface Competition {
  id: number;
  name: string;
  code: string | null;
  logoUrl: string | null;
}

export interface Match {
  id: number;
  kickoffAt: string;
  status: MatchStatus;
  homeScore: number | null;
  awayScore: number | null;
  minute: number | null;
  competition: Competition;
  homeTeam: Team;
  awayTeam: Team;
}

export interface MatchEvent {
  id: number;
  type: string;
  minute: number;
  playerName: string | null;
  team: { id: number; shortName: string | null } | null;
}

export interface MatchDetail extends Match {
  events: MatchEvent[]; highlights: Highlight[];
}

export interface StandingRow {
  id: number;
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  team: Team;
}

export interface StandingsResponse {
  competition: { id: number; name: string; code: string | null };
  season: number | null;
  table: StandingRow[];
}

export interface MatchUpdate {
  id: number;
  status: MatchStatus;
  homeScore: number | null;
  awayScore: number | null;
  minute: number | null;
}

export interface Highlight {
  id: number;
  youtubeVideoId: string;
  title: string | null;
}

export interface Broadcaster {
  id: number;
  name: string;
  country: string;
  url: string;
}
