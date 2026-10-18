import { Router } from "express";
import { prisma } from "../lib/prisma";
import { cached } from "../lib/cache";
import { queryString, wrap } from "../lib/http";

export const competitionsRouter = Router();

// GET /api/competitions
competitionsRouter.get(
  "/",
  wrap(async (_req, res) => {
    const { data, hit } = await cached("competitions:list", 300, () =>
      prisma.competition.findMany({ orderBy: { name: "asc" } }),
    );
    res.set("X-Cache", hit ? "HIT" : "MISS").json(data);
  }),
);

// GET /api/competitions/PL/standings?season=2026
competitionsRouter.get(
  "/:code/standings",
  wrap(async (req, res) => {
    const code = String(req.params.code).toUpperCase();
    const competition = await prisma.competition.findFirst({ where: { code } });
    if (!competition) {
      res.status(404).json({ error: "Competition not found" });
      return;
    }

    const seasonParam = queryString(req.query.season);
    const requestedSeason = seasonParam ? Number(seasonParam) : undefined;
    if (seasonParam && !Number.isInteger(requestedSeason)) {
      res.status(400).json({ error: "season must be a number, e.g. 2026" });
      return;
    }

    const { data, hit } = await cached(
      `standings:${code}:${requestedSeason ?? "latest"}`,
      300,
      async () => {
        let season = requestedSeason;
        if (season === undefined) {
          const latest = await prisma.standing.aggregate({
            where: { competitionId: competition.id },
            _max: { season: true },
          });
          season = latest._max.season ?? undefined;
        }

        const summary = { id: competition.id, name: competition.name, code: competition.code };
        if (season === undefined) return { competition: summary, season: null, table: [] };

        const table = await prisma.standing.findMany({
          where: { competitionId: competition.id, season },
          orderBy: { position: "asc" },
          include: {
            team: { select: { id: true, name: true, shortName: true, crestUrl: true } },
          },
        });
        return { competition: summary, season, table };
      },
    );
    res.set("X-Cache", hit ? "HIT" : "MISS").json(data);
  }),
);

