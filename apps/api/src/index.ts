import http from "http";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { competitionsRouter } from "./routes/competitions";
import { matchesRouter } from "./routes/matches";
import { broadcastersRouter } from "./routes/broadcasters";
import { adminRouter } from "./routes/admin";
import { devRouter } from "./routes/dev";
import { initSocket } from "./lib/socket";
import { startLivePolling } from "./live/livePoller";

dotenv.config({ path: "../../.env" });

const app = express();
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/competitions", competitionsRouter);
app.use("/api/matches", matchesRouter);
app.use("/api/broadcasters", broadcastersRouter);
app.use("/api/admin", adminRouter);

if (process.env.NODE_ENV !== "production") {
  app.use("/dev", devRouter);
}

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use(
  (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  },
);

const server = http.createServer(app);
initSocket(server);

const port = Number(process.env.PORT) || 4000;
server.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
  startLivePolling();
});
