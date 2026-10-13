import { beforeEach, describe, expect, it, vi } from "vitest";

// Replace the database and the football-data.org client with fakes.
vi.mock("../lib/prisma", () => ({
  prisma: {
    competition: {
      upsert: vi.fn(async (args: { create: Record<string, unknown> }) => ({ id: 1, ...args.create })),
    },
    team: {
      upsert: vi.fn(async (args: { where: { externalId: number } }) => ({
        id: args.where.externalId,
      })),
    },
    standing: { upsert: vi.fn(async () => ({})) },
    match: { upsert: vi.fn(async () => ({})) },
  },
}));

vi.mock("../lib/footballData", () => ({
  getCompetition: vi.fn(),
  getStandings: vi.fn(),
  getMatches: vi.fn(),
}));

import { prisma } from "../lib/prisma";
import { getCompetition, getMatches, getStandings } from "../lib/footballData";
import { mapStatus, syncCompetition } from "./syncCompetition";

const arsenal = { id: 57, name: "Arsenal FC", shortName: "Arsenal", crest: null };
const chelsea = { id: 61, name: "Chelsea FC", shortName: "Chelsea", crest: null };

const row = {
  position: 1,
  team: arsenal,
  playedGames: 1,
  won: 1,
  draw: 0,
  lost: 0,
  points: 3,
  goalsFor: 2,
  goalsAgainst: 0,
};

describe("mapStatus", () => {
  it.each([
    ["IN_PLAY", "LIVE"],
    ["PAUSED", "PAUSED"],
    ["FINISHED", "FINISHED"],
    ["AWARDED", "FINISHED"],
    ["POSTPONED", "POSTPONED"],
    ["SUSPENDED", "POSTPONED"],
    ["CANCELLED", "CANCELLED"],
    ["TIMED", "SCHEDULED"],
    ["SCHEDULED", "SCHEDULED"],
    ["SOMETHING_NEW", "SCHEDULED"],
  ])("maps %s to %s", (input, expected) => {
    expect(mapStatus(input)).toBe(expected);
  });
});

describe("syncCompetition", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCompetition).mockResolvedValue({
      id: 2021,
      name: "Premier League",
      code: "PL",
      emblem: null,
      area: { name: "England" },
    });
  });

  it("stores the competition, standings and matches", async () => {
    vi.mocked(getStandings).mockResolvedValue({
      season: { startDate: "2026-08-15" },
      standings: [
        { type: "TOTAL", table: [row] },
        { type: "HOME", table: [row] }, // must be ignored
      ],
    });
    vi.mocked(getMatches).mockResolvedValue({
      matches: [
        {
          id: 1001,
          utcDate: "2026-10-17T15:00:00Z",
          status: "IN_PLAY",
          homeTeam: arsenal,
          awayTeam: chelsea,
          score: { fullTime: { home: 1, away: 0 } },
        },
      ],
    });

    const result = await syncCompetition("PL");

    expect(result).toEqual({ competition: "Premier League", season: 2026, standings: 1, matches: 1 });
    expect(prisma.standing.upsert).toHaveBeenCalledTimes(1);
    // Arsenal is saved once and then reused from the cache, so only 2 team upserts.
    expect(prisma.team.upsert).toHaveBeenCalledTimes(2);
    expect(prisma.match.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { externalId: 1001 },
        update: expect.objectContaining({ status: "LIVE", homeScore: 1, awayScore: 0 }),
      }),
    );
  });

  it("keeps scores empty for matches that have not been played", async () => {
    vi.mocked(getStandings).mockResolvedValue({
      season: { startDate: "2026-08-15" },
      standings: [{ type: "TOTAL", table: [row] }],
    });
    vi.mocked(getMatches).mockResolvedValue({
      matches: [
        {
          id: 1002,
          utcDate: "2026-11-01T15:00:00Z",
          status: "TIMED",
          homeTeam: chelsea,
          awayTeam: arsenal,
          score: { fullTime: { home: null, away: null } },
        },
      ],
    });

    await syncCompetition("PL");

    expect(prisma.match.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ status: "SCHEDULED", homeScore: null, awayScore: null }),
      }),
    );
  });
});
