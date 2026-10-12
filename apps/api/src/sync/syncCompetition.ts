import { prisma } from "../lib/prisma";
import { getCompetition, getMatches, getStandings, type FdTeam } from "../lib/footballData";

type MatchStatusValue =
  | "SCHEDULED"
  | "LIVE"
  | "PAUSED"
  | "FINISHED"
  | "POSTPONED"
  | "CANCELLED";

// Translate football-data.org statuses into our own enum.
function mapStatus(status: string): MatchStatusValue {
  switch (status) {
    case "IN_PLAY":
      return "LIVE";
    case "PAUSED":
      return "PAUSED";
    case "FINISHED":
    case "AWARDED":
      return "FINISHED";
    case "POSTPONED":
    case "SUSPENDED":
      return "POSTPONED";
    case "CANCELLED":
      return "CANCELLED";
    default:
      return "SCHEDULED"; // SCHEDULED and TIMED
  }
}

async function upsertTeam(team: FdTeam, cache: Map<number, number>): Promise<number> {
  const cached = cache.get(team.id);
  if (cached) return cached;

  const row = await prisma.team.upsert({
    where: { externalId: team.id },
    update: { name: team.name, shortName: team.shortName, crestUrl: team.crest },
    create: {
      externalId: team.id,
      name: team.name,
      shortName: team.shortName,
      crestUrl: team.crest,
    },
  });
  cache.set(team.id, row.id);
  return row.id;
}

export async function syncCompetition(code: string) {
  const teamIds = new Map<number, number>();

  // 1. Competition
  const comp = await getCompetition(code);
  const competition = await prisma.competition.upsert({
    where: { externalId: comp.id },
    update: {
      name: comp.name,
      code: comp.code,
      country: comp.area?.name ?? null,
      logoUrl: comp.emblem,
    },
    create: {
      externalId: comp.id,
      name: comp.name,
      code: comp.code,
      country: comp.area?.name ?? null,
      logoUrl: comp.emblem,
    },
  });

  // 2. Standings
  const standingsData = await getStandings(code);
  const season = Number(standingsData.season.startDate.slice(0, 4));
  const rows = standingsData.standings
    .filter((s) => s.type === "TOTAL")
    .flatMap((s) => s.table);

  for (const row of rows) {
    const teamId = await upsertTeam(row.team, teamIds);
    const data = {
      position: row.position,
      played: row.playedGames,
      won: row.won,
      drawn: row.draw,
      lost: row.lost,
      goalsFor: row.goalsFor,
      goalsAgainst: row.goalsAgainst,
      points: row.points,
    };
    await prisma.standing.upsert({
      where: {
        competitionId_teamId_season: { competitionId: competition.id, teamId, season },
      },
      update: data,
      create: { competitionId: competition.id, teamId, season, ...data },
    });
  }

  // 3. Matches
  const matchesData = await getMatches(code);
  for (const m of matchesData.matches) {
    const homeTeamId = await upsertTeam(m.homeTeam, teamIds);
    const awayTeamId = await upsertTeam(m.awayTeam, teamIds);
    const data = {
      competitionId: competition.id,
      homeTeamId,
      awayTeamId,
      kickoffAt: new Date(m.utcDate),
      status: mapStatus(m.status),
      homeScore: m.score.fullTime.home,
      awayScore: m.score.fullTime.away,
    };
    await prisma.match.upsert({
      where: { externalId: m.id },
      update: data,
      create: { externalId: m.id, ...data },
    });
  }

  return {
    competition: competition.name,
    season,
    standings: rows.length,
    matches: matchesData.matches.length,
  };
}
