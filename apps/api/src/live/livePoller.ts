import { prisma } from "../lib/prisma";
import { getMatchesByDate } from "../lib/footballData";
import { broadcastMatchUpdate } from "../lib/socket";
import { invalidateMatch } from "../lib/invalidate";
import { mapStatus } from "../sync/syncCompetition";

const ACTIVE_DELAY_MS = 60_000; // a match is in play or about to start
const IDLE_DELAY_MS = 10 * 60_000; // nothing on: check rarely (must stay below the 15 minute look-ahead)
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

export async function pollLiveMatches(): Promise<{ active: boolean; changed: number }> {
  const codes = await activeCompetitionCodes();
  let changed = 0;

  for (const code of codes) {
    const from = isoDate(new Date(Date.now() - DAY));
    const to = isoDate(new Date(Date.now() + DAY));
    const { matches } = await getMatchesByDate(code, from, to);

    for (const m of matches) {
      const existing = await prisma.match.findUnique({ where: { externalId: m.id } });
      if (!existing) continue; // new fixtures are added by the scheduled sync

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
  return { active: codes.length > 0, changed };
}

export function startLivePolling() {
  const loop = async () => {
    let delay = ACTIVE_DELAY_MS;
    try {
      const { active, changed } = await pollLiveMatches();
      if (changed > 0) console.log(`Live poll: ${changed} match(es) updated`);
      if (!active) delay = IDLE_DELAY_MS;
    } catch (e) {
      console.error("Live poll failed:", (e as Error).message);
    }
    setTimeout(loop, delay);
  };

  void loop();
  console.log("Live polling started: every 60s while matches are on, every 10 min otherwise");
}
