import { Router } from "express";
import { prisma } from "../lib/prisma";
import { cached } from "../lib/cache";
import { wrap } from "../lib/http";

export const teamsRouter = Router();

// GET /api/teams/1
teamsRouter.get(
  "/:id",
  wrap(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: "id must be a number" });
      return;
    }

    const { data, hit } = await cached(`team:${id}`, 300, () =>
      prisma.team.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          shortName: true,
          crestUrl: true,
          standings: {
            orderBy: { season: "desc" },
            take: 1,
            select: {
              season: true,
              position: true,
              played: true,
              won: true,
              drawn: true,
              lost: true,
              goalsFor: true,
              goalsAgainst: true,
              points: true,
              competition: { select: { name: true, code: true } },
            },
          },
        },
      }),
    );

    if (!data) {
      res.status(404).json({ error: "Team not found" });
      return;
    }
    res.set("X-Cache", hit ? "HIT" : "MISS").json(data);
  }),
);
