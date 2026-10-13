-- CreateTable
CREATE TABLE "Broadcaster" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "competitionId" INTEGER,

    CONSTRAINT "Broadcaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchHighlight" (
    "id" SERIAL NOT NULL,
    "matchId" INTEGER NOT NULL,
    "youtubeVideoId" TEXT NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchHighlight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Broadcaster_country_idx" ON "Broadcaster"("country");

-- CreateIndex
CREATE INDEX "Broadcaster_competitionId_idx" ON "Broadcaster"("competitionId");

-- CreateIndex
CREATE UNIQUE INDEX "MatchHighlight_matchId_youtubeVideoId_key" ON "MatchHighlight"("matchId", "youtubeVideoId");

-- AddForeignKey
ALTER TABLE "Broadcaster" ADD CONSTRAINT "Broadcaster_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchHighlight" ADD CONSTRAINT "MatchHighlight_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
