import { prisma } from "../lib/prisma";
import { syncCompetitionCodes } from "../lib/competitions";
import { syncAll } from "./syncAll";

// pnpm sync            -> syncs the competitions in SYNC_COMPETITIONS (default PL)
// pnpm sync PL PD SA   -> syncs exactly these
const args = process.argv.slice(2).map((arg) => arg.toUpperCase());

async function main() {
  // Remove the fake matches from the dev seed (their events are deleted too).
  await prisma.match.deleteMany({ where: { externalId: { in: [900001, 900002, 900003] } } });
  await syncAll(args.length > 0 ? args : syncCompetitionCodes());
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
