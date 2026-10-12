import { prisma } from "../lib/prisma";
import { getMatchesByDate } from "../lib/footballData";
import { broadcastMatchUpdate } from "../lib/socket";
import { invalidateMatch } from "../lib/invalidate";
import { mapStatus } from "../sync/syncCompetition";

const POLL_INTERVAL_MS = 60_000;
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const isoDate = (d: Date) => d.toISOString().slice(0, 10);

// Competitions that have a match in play, or one that should be starting about now.
async function activeCompetitionCodes(): Promise<string[]> {
  const now = Date.now();
  const rows = await prisma.match.findMany({
    where: {
      OR: [
        { status: { in: ["LIVE", "PAUSED"] } },
        {
          status: "SCHEDULED",
          kickoffAt: { gte: new Date(now - 4 * HOUR), lte: new Date(now + 15 * 60 * 1000) },
        },
      ],
    },
    select: { competition: { select: { code: true } } },
  });
  const codes = rows.map((r) => r.competition.code).filter((c): c is string => !!c);
  return [...new Set(codes)];
}

export async function pollLiveMatches(): Promise<number> {
  const codes = await activeCompetitionCodes();
  let changed = 0;

  for (const code of codes) {
    const from = isoDate(new Date(Date.now() - DAY));
    const to = isoDate(new Date(Date.now() + DAY));
    const { matches } = await getMatchesByDate(code, from, to);

    for (const m of matches) {
      const existing = await prisma.match.findUnique({ where: { externalId: m.id } });
      if (!existing) continue; // new fixtures are added by the daily sync

      const status = mapStatus(m.status);
      const homeScore = m.score.fullTime.home;
      const awayScore = m.score.fullTime.away;

      if (
        existing.status === status &&
        existing.homeScore === homeScore &&
        existing.awayScore === awayScore
      ) {
        continue;
      }

      const updated = await prisma.match.update({
        where: { id: existing.id },
        data: { status, homeScore, awayScore },
      });
      changed++;
      await invalidateMatch(updated.id);
      broadcastMatchUpdate({
        id: updated.id,
        status: updated.status,
        homeScore: updated.homeScore,
        awayScore: updated.awayScore,
        minute: updated.minute,
      });
      console.log(
        `Match ${updated.id}: ${updated.status} ${updated.homeScore ?? "-"}-${updated.awayScore ?? "-"}`,
      );
    }
  }
  return changed;
}

export function startLivePolling() {
  let running = false;

  const tick = async () => {
    if (running) return; // never overlap two polls
    running = true;
    try {
      const n = await pollLiveMatches();
      if (n > 0) console.log(`Live poll: ${n} match(es) updated`);
    } catch (e) {
      console.error("Live poll failed:", (e as Error).message);
    } finally {
      running = false;
    }
  };

  void tick();
  setInterval(tick, POLL_INTERVAL_MS);
  console.log("Live polling started: checks every 60s, calls the data API only while matches are in play");
}
