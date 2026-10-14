# Football Hub

A football live scores, fixtures, standings and highlights website. Scores update live in the browser without a refresh.

It deliberately does not stream or link to unlicensed match streams. Data comes from the football-data.org API, highlights are embedded from official YouTube channels, and a "where to watch" box links to official broadcasters.

## Features

- Live scores pushed to the page with Socket.IO (no refresh)
- League table, fixtures, results, team pages and match pages
- Favorite teams saved in the browser (localStorage)
- Embedded official highlights and broadcaster links, managed from a token-protected admin page
- Redis-cached REST API with a background sync from football-data.org
- SEO: per-page titles and descriptions, sitemap.xml, robots.txt
- Responsive layout, plus Vitest tests for the API and the sync logic

## Stack

- Monorepo (pnpm): apps/web and apps/api
- Web: Next.js (App Router), TypeScript, Tailwind CSS
- API: Node.js, Express, TypeScript, Socket.IO
- Data: PostgreSQL with Prisma, Redis for caching
- Tests: Vitest, Supertest

## Getting started

Requirements: Node.js 20+, pnpm, Docker Desktop, and a free API key from https://www.football-data.org

    pnpm install
    copy .env.example .env
    docker compose up -d
    pnpm --filter api exec prisma migrate deploy
    pnpm --filter api exec prisma generate
    pnpm sync
    pnpm dev:api
    pnpm dev:web

Edit .env first and fill in FOOTBALL_DATA_API_KEY and ADMIN_TOKEN. Run `pnpm dev:api` and `pnpm dev:web` in two separate terminals. `pnpm sync` loads fixtures and standings and takes about 30 seconds.

Open http://localhost:3000. The admin page is at /admin and needs the ADMIN_TOKEN from your .env.

## Scripts

- `pnpm dev:web` starts the website
- `pnpm dev:api` starts the API, the Socket.IO server and the live poller
- `pnpm sync` runs a one-off sync from football-data.org
- `pnpm worker` syncs on start, then every 12 hours
- `pnpm test` runs the API and sync tests
- `pnpm format` formats the code with Prettier

## How it works

- A sync job pulls competitions, standings and matches into Postgres (upserts keyed by the provider's ids).
- A live poller checks the data API every 60 seconds, but only while a match is in play or about to start, to stay inside the free-tier rate limit.
- When a score or status changes, the API updates the database, clears the cache and pushes the change to subscribed browsers.
- The free data plan has no match minute and no goals or cards timeline.

## API

- GET /api/competitions and GET /api/competitions/:code/standings
- GET /api/matches (filters: date, competition, status, team, order, limit), GET /api/matches/live and GET /api/matches/:id
- GET /api/teams/:id and GET /api/broadcasters?competition=PL
- /api/admin/* needs the header "Authorization: Bearer <ADMIN_TOKEN>"
