import { Router } from "express";
import { prisma } from "../lib/prisma";
import { cached } from "../lib/cache";
import { queryString, wrap } from "../lib/http";

export const matchesRouter = Router();

const STATUSES = ["SCHEDULED", "LIVE", "PAUSED", "FINISHED", "POSTPONED", "CANCELLED"] as const;
type Status = (typeof STATUSES)[number];

const teamSelect = { id: true, name: true, shortName: true, crestUrl: true } as const;

const matchInclude = {
  competition: { select: { id: true, name: true, code: true, logoUrl: true } },
  homeTeam: { select: teamSelect },
  awayTeam: { select: teamSelect },
} as const;

// GET /api/matches/live  (must be declared before /:id)
matchesRouter.get(
  "/live",
  wrap(async (_req, res) => {
    const { data, hit } = await cached("matches:live", 10, () =>
      prisma.match.findMany({
        where: { status: { in: ["LIVE", "PAUSED"] } },
        include: matchInclude,
        orderBy: { kickoffAt: "asc" },
      }),
    );
    res.set("X-Cache", hit ? "HIT" : "MISS").json(data);
  }),
);

// GET /api/matches?date=2026-10-17&competition=PL&status=FINISHED&order=desc&limit=8
matchesRouter.get(
  "/",
  wrap(async (req, res) => {
    const dateParam = queryString(req.query.date);
    const competition = queryString(req.query.competition)?.toUpperCase();
    const statusParam = queryString(req.query.status)?.toUpperCase();
    const order = queryString(req.query.order)?.toLowerCase() === "desc" ? "desc" : "asc";
    const limitParam = Number(queryString(req.query.limit));
    const limit =
      Number.isInteger(limitParam) && limitParam > 0 ? Math.min(limitParam, 200) : 200;

    if (dateParam && !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      res.status(400).json({ error: "date must look like 2026-10-17" });
      return;
    }
    if (statusParam && !STATUSES.includes(statusParam as Status)) {
      res.status(400).json({ error: `status must be one of: ${STATUSES.join(", ")}` });
      return;
    }
    const status = statusParam as Status | undefined;

    // With no date and no status, default to today's matches (UTC).
    const date = dateParam ?? (status ? undefined : new Date().toISOString().slice(0, 10));
    const start = date ? new Date(`${date}T00:00:00.000Z`) : undefined;
    if (start && Number.isNaN(start.getTime())) {
      res.status(400).json({ error: "invalid date" });
      return;
    }
    const end = start ? new Date(start.getTime() + 24 * 60 * 60 * 1000) : undefined;

    const where = {
      ...(competition ? { competition: { code: competition } } : {}),
      ...(status ? { status } : {}),
      ...(start && end ? { kickoffAt: { gte: start, lt: end } } : {}),
    };

    const key = `matches:${date ?? "any"}:${competition ?? "all"}:${status ?? "any"}:${order}:${limit}`;
    const { data, hit } = await cached(key, 15, () =>
      prisma.match.findMany({
        where,
        include: matchInclude,
        orderBy: { kickoffAt: order },
        take: limit,
      }),
    );
    res.set("X-Cache", hit ? "HIT" : "MISS").json(data);
  }),
);

// GET /api/matches/1
matchesRouter.get(
  "/:id",
  wrap(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: "id must be a number" });
      return;
    }

    const { data, hit } = await cached(`match:${id}`, 15, () =>
      prisma.match.findUnique({
        where: { id },
        include: {
          ...matchInclude,
          events: {
            orderBy: { minute: "asc" },
            include: { team: { select: { id: true, shortName: true } } },
          },
        },
      }),
    );

    if (!data) {
      res.status(404).json({ error: "Match not found" });
      return;
    }
    res.set("X-Cache", hit ? "HIT" : "MISS").json(data);
  }),
);
