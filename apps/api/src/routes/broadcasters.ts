import { Router } from "express";
import { prisma } from "../lib/prisma";
import { cached } from "../lib/cache";
import { queryString, wrap } from "../lib/http";

export const broadcastersRouter = Router();

// GET /api/broadcasters?competition=PL
// Returns broadcasters for that competition plus those that apply to every competition.
broadcastersRouter.get(
  "/",
  wrap(async (req, res) => {
    const code = queryString(req.query.competition)?.toUpperCase();

    const { data, hit } = await cached(`broadcasters:${code ?? "all"}`, 60, () =>
      prisma.broadcaster.findMany({
        where: code ? { OR: [{ competitionId: null }, { competition: { code } }] } : {},
        orderBy: [{ country: "asc" }, { name: "asc" }],
        select: { id: true, name: true, country: true, url: true },
      }),
    );
    res.set("X-Cache", hit ? "HIT" : "MISS").json(data);
  }),
);
