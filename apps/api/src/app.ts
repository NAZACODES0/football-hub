import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { competitionsRouter } from "./routes/competitions";
import { matchesRouter } from "./routes/matches";
import { teamsRouter } from "./routes/teams";
import { broadcastersRouter } from "./routes/broadcasters";
import { adminRouter } from "./routes/admin";
import { devRouter } from "./routes/dev";

dotenv.config({ path: "../../.env" });

export const app = express();
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/competitions", competitionsRouter);
app.use("/api/matches", matchesRouter);
app.use("/api/teams", teamsRouter);
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
