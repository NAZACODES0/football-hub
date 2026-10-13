import { Router } from "express";
import { prisma } from "../lib/prisma";
import { invalidateMatch } from "../lib/invalidate";
import { requireAdmin } from "../lib/admin";
import { wrap } from "../lib/http";

export const adminRouter = Router();
adminRouter.use(requireAdmin);

const ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

// Accepts a bare video id or a youtube.com / youtu.be link.
function parseYoutubeId(input: string): string | null {
  const value = input.trim();
  if (ID_PATTERN.test(value)) return value;

  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    let id: string | null = null;

    if (host === "youtu.be") {
      id = url.pathname.slice(1).split("/")[0] ?? null;
    } else if (host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname === "/watch") {
        id = url.searchParams.get("v");
      } else {
        const m = url.pathname.match(/^\/(?:embed|shorts|live)\/([A-Za-z0-9_-]{11})/);
        id = m ? m[1] : null;
      }
    }
    return id && ID_PATTERN.test(id) ? id : null;
  } catch {
    return null;
  }
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

// GET /api/admin/check  (lets the admin page verify the token)
adminRouter.get("/check", (_req, res) => {
  res.json({ ok: true });
});

// ---- Broadcasters ----

adminRouter.get(
  "/broadcasters",
  wrap(async (_req, res) => {
    const rows = await prisma.broadcaster.findMany({
      orderBy: [{ country: "asc" }, { name: "asc" }],
      include: { competition: { select: { code: true, name: true } } },
    });
    res.json(rows);
  }),
);

adminRouter.post(
  "/broadcasters",
  wrap(async (req, res) => {
    const { name, country, url, competition } = req.body ?? {};

    if (typeof name !== "string" || name.trim().length < 1 || name.length > 80) {
      res.status(400).json({ error: "name is required (max 80 characters)" });
      return;
    }
    if (typeof country !== "string" || country.trim().length < 1 || country.length > 60) {
      res.status(400).json({ error: "country is required (max 60 characters)" });
      return;
    }
    if (typeof url !== "string" || !isHttpUrl(url.trim())) {
      res.status(400).json({ error: "url must start with http:// or https://" });
      return;
    }

    let competitionId: number | null = null;
    if (typeof competition === "string" && competition.length > 0) {
      const comp = await prisma.competition.findFirst({
        where: { code: competition.toUpperCase() },
      });
      if (!comp) {
        res.status(400).json({ error: "Unknown competition code" });
        return;
      }
      competitionId = comp.id;
    }

    const created = await prisma.broadcaster.create({
      data: { name: name.trim(), country: country.trim(), url: url.trim(), competitionId },
    });
    res.status(201).json(created);
  }),
);

adminRouter.delete(
  "/broadcasters/:id",
  wrap(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: "id must be a number" });
      return;
    }
    await prisma.broadcaster.deleteMany({ where: { id } });
    res.status(204).end();
  }),
);

// ---- Highlights ----

adminRouter.get(
  "/highlights",
  wrap(async (req, res) => {
    const matchId = Number(req.query.matchId);
    if (!Number.isInteger(matchId)) {
      res.status(400).json({ error: "matchId must be a number" });
      return;
    }
    const rows = await prisma.matchHighlight.findMany({
      where: { matchId },
      orderBy: { createdAt: "asc" },
    });
    res.json(rows);
  }),
);

adminRouter.post(
  "/highlights",
  wrap(async (req, res) => {
    const { matchId, video, title } = req.body ?? {};

    if (!Number.isInteger(matchId)) {
      res.status(400).json({ error: "matchId must be a number" });
      return;
    }
    const youtubeVideoId = typeof video === "string" ? parseYoutubeId(video) : null;
    if (!youtubeVideoId) {
      res.status(400).json({ error: "Could not read a YouTube video id from that link" });
      return;
    }
    const cleanTitle =
      typeof title === "string" && title.trim().length > 0 ? title.trim().slice(0, 120) : null;

    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) {
      res.status(404).json({ error: "Match not found" });
      return;
    }

    const saved = await prisma.matchHighlight.upsert({
      where: { matchId_youtubeVideoId: { matchId, youtubeVideoId } },
      update: { title: cleanTitle },
      create: { matchId, youtubeVideoId, title: cleanTitle },
    });
    await invalidateMatch(matchId);
    res.status(201).json(saved);
  }),
);

adminRouter.delete(
  "/highlights/:id",
  wrap(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: "id must be a number" });
      return;
    }
    const existing = await prisma.matchHighlight.findUnique({ where: { id } });
    if (existing) {
      await prisma.matchHighlight.delete({ where: { id } });
      await invalidateMatch(existing.matchId);
    }
    res.status(204).end();
  }),
);
