import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireUser } from "../lib/requireUser";
import { wrap } from "../lib/http";

export const meRouter = Router();
meRouter.use(requireUser);

const MAX_FAVORITES = 50;

async function listFavorites(userId: string) {
  const rows = await prisma.favoriteTeam.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  const teams = await prisma.team.findMany({
    where: { id: { in: rows.map((r) => r.teamId) } },
    select: { id: true, name: true, shortName: true, crestUrl: true },
  });
  const byId = new Map(teams.map((t) => [t.id, t]));
  return rows.map((r) => byId.get(r.teamId)).filter((t) => t !== undefined);
}

// GET /api/me/favorites
meRouter.get(
  "/favorites",
  wrap(async (req, res) => {
    res.json(await listFavorites(req.userId!));
  }),
);

// PUT /api/me/favorites/12
meRouter.put(
  "/favorites/:teamId",
  wrap(async (req, res) => {
    const userId = req.userId!;
    const teamId = Number(req.params.teamId);
    if (!Number.isInteger(teamId)) {
      res.status(400).json({ error: "teamId must be a number" });
      return;
    }
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) {
      res.status(404).json({ error: "Team not found" });
      return;
    }
    const count = await prisma.favoriteTeam.count({ where: { userId } });
    const exists = await prisma.favoriteTeam.findUnique({
      where: { userId_teamId: { userId, teamId } },
    });
    if (!exists && count >= MAX_FAVORITES) {
      res.status(400).json({ error: `You can have at most ${MAX_FAVORITES} favorites` });
      return;
    }
    await prisma.favoriteTeam.upsert({
      where: { userId_teamId: { userId, teamId } },
      update: {},
      create: { userId, teamId },
    });
    res.status(204).end();
  }),
);

// DELETE /api/me/favorites/12
meRouter.delete(
  "/favorites/:teamId",
  wrap(async (req, res) => {
    const teamId = Number(req.params.teamId);
    if (!Number.isInteger(teamId)) {
      res.status(400).json({ error: "teamId must be a number" });
      return;
    }
    await prisma.favoriteTeam.deleteMany({ where: { userId: req.userId!, teamId } });
    res.status(204).end();
  }),
);

// POST /api/me/favorites/merge   body: {"teamIds":[1,2,3]}
// Used after sign-in to add the favorites saved in this browser. Returns the full list.
meRouter.post(
  "/favorites/merge",
  wrap(async (req, res) => {
    const userId = req.userId!;
    const raw: unknown = req.body?.teamIds;
    const ids = Array.isArray(raw)
      ? raw.filter((n): n is number => Number.isInteger(n)).slice(0, MAX_FAVORITES)
      : [];

    const valid = await prisma.team.findMany({ where: { id: { in: ids } }, select: { id: true } });
    const existing = await prisma.favoriteTeam.count({ where: { userId } });
    const room = Math.max(0, MAX_FAVORITES - existing);

    await prisma.favoriteTeam.createMany({
      data: valid.slice(0, room).map((t) => ({ userId, teamId: t.id })),
      skipDuplicates: true,
    });
    res.json(await listFavorites(userId));
  }),
);
