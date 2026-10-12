import { prisma } from "../src/lib/prisma";

async function main() {
  const pl = await prisma.competition.upsert({
    where: { externalId: 2021 },
    update: {},
    create: { externalId: 2021, name: "Premier League", code: "PL", country: "England" },
  });

  const teamData = [
    { externalId: 57, name: "Arsenal FC", shortName: "Arsenal" },
    { externalId: 61, name: "Chelsea FC", shortName: "Chelsea" },
    { externalId: 64, name: "Liverpool FC", shortName: "Liverpool" },
    { externalId: 65, name: "Manchester City FC", shortName: "Man City" },
    { externalId: 66, name: "Manchester United FC", shortName: "Man United" },
    { externalId: 73, name: "Tottenham Hotspur FC", shortName: "Tottenham" },
  ];

  const teams = [];
  for (const t of teamData) {
    teams.push(
      await prisma.team.upsert({
        where: { externalId: t.externalId },
        update: {},
        create: t,
      }),
    );
  }
  const [arsenal, chelsea, liverpool, city, united, spurs] = teams;

  const now = Date.now();
  const hours = (h: number) => new Date(now + h * 60 * 60 * 1000);

  const finished = await prisma.match.upsert({
    where: { externalId: 900001 },
    update: {},
    create: {
      externalId: 900001,
      competitionId: pl.id,
      homeTeamId: arsenal.id,
      awayTeamId: chelsea.id,
      kickoffAt: hours(-26),
      status: "FINISHED",
      homeScore: 2,
      awayScore: 1,
    },
  });

  const live = await prisma.match.upsert({
    where: { externalId: 900002 },
    update: {},
    create: {
      externalId: 900002,
      competitionId: pl.id,
      homeTeamId: liverpool.id,
      awayTeamId: city.id,
      kickoffAt: hours(-1.2),
      status: "LIVE",
      homeScore: 1,
      awayScore: 1,
      minute: 67,
    },
  });

  await prisma.match.upsert({
    where: { externalId: 900003 },
    update: {},
    create: {
      externalId: 900003,
      competitionId: pl.id,
      homeTeamId: united.id,
      awayTeamId: spurs.id,
      kickoffAt: hours(24),
      status: "SCHEDULED",
    },
  });

  await prisma.matchEvent.deleteMany({
    where: { matchId: { in: [finished.id, live.id] } },
  });
  await prisma.matchEvent.createMany({
    data: [
      { matchId: finished.id, teamId: arsenal.id, type: "GOAL", minute: 12, playerName: "Test Player A" },
      { matchId: finished.id, teamId: chelsea.id, type: "GOAL", minute: 55, playerName: "Test Player B" },
      { matchId: finished.id, teamId: arsenal.id, type: "GOAL", minute: 81, playerName: "Test Player C" },
      { matchId: live.id, teamId: liverpool.id, type: "GOAL", minute: 23, playerName: "Test Player D" },
      { matchId: live.id, teamId: city.id, type: "YELLOW_CARD", minute: 40, playerName: "Test Player E" },
      { matchId: live.id, teamId: city.id, type: "GOAL", minute: 58, playerName: "Test Player F" },
    ],
  });

  const table = [
    { team: arsenal, won: 3, drawn: 0, lost: 0, gf: 7, ga: 2 },
    { team: city, won: 2, drawn: 1, lost: 0, gf: 6, ga: 2 },
    { team: liverpool, won: 2, drawn: 0, lost: 1, gf: 5, ga: 3 },
    { team: chelsea, won: 1, drawn: 1, lost: 1, gf: 4, ga: 4 },
    { team: united, won: 1, drawn: 0, lost: 2, gf: 3, ga: 5 },
    { team: spurs, won: 0, drawn: 0, lost: 3, gf: 1, ga: 8 },
  ];

  for (const [i, row] of table.entries()) {
    const data = {
      position: i + 1,
      played: row.won + row.drawn + row.lost,
      won: row.won,
      drawn: row.drawn,
      lost: row.lost,
      goalsFor: row.gf,
      goalsAgainst: row.ga,
      points: row.won * 3 + row.drawn,
    };
    await prisma.standing.upsert({
      where: {
        competitionId_teamId_season: { competitionId: pl.id, teamId: row.team.id, season: 2026 },
      },
      update: data,
      create: { competitionId: pl.id, teamId: row.team.id, season: 2026, ...data },
    });
  }

  console.log("Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
