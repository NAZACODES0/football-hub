import { Router } from "express";
import { prisma } from "../lib/prisma";
import { broadcastMatchUpdate } from "../lib/socket";
import { invalidateMatch } from "../lib/invalidate";
import { wrap } from "../lib/http";

// Development helper: fake a score change to test the live updates.
export const devRouter = Router();

const STATUSES: readonly string[] = [
  "SCHEDULED",
  "LIVE",
  "PAUSED",
  "FINISHED",
  "POSTPONED",
  "CANCELLED",
];

// POST /dev/matches/1/score   body: {"home":2,"away":1,"status":"LIVE"}
devRouter.post(
  "/matches/:id/score",
  wrap(async (req, res) => {
    const id = Number(req.params.id);
    const { home, away, status } = req.body ?? {};

    if (
      !Number.isInteger(id) ||
      !Number.isInteger(home) ||
      !Number.isInteger(away) ||
      !STATUSES.includes(status)
    ) {
      res.status(400).json({ error: "Send {home: number, away: number, status: MATCH_STATUS}" });
      return;
    }

    const existing = await prisma.match.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Match not found" });
      return;
    }

    const updated = await prisma.match.update({
      where: { id },
      data: { homeScore: home, awayScore: away, status },
    });
    await invalidateMatch(id);
    broadcastMatchUpdate({
      id,
      status: updated.status,
      homeScore: updated.homeScore,
      awayScore: updated.awayScore,
      minute: updated.minute,
    });
    res.json(updated);
  }),
);
