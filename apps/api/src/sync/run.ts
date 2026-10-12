import { prisma } from "../lib/prisma";
import { syncAll } from "./syncAll";

const args = process.argv.slice(2);
const codes = args.length > 0 ? args : ["PL"];

async function main() {
  // Remove the fake matches from the dev seed (their events are deleted too).
  await prisma.match.deleteMany({ where: { externalId: { in: [900001, 900002, 900003] } } });
  await syncAll(codes);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
