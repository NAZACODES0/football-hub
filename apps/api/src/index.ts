import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { competitionsRouter } from "./routes/competitions";
import { matchesRouter } from "./routes/matches";

dotenv.config({ path: "../../.env" });

const app = express();
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/competitions", competitionsRouter);
app.use("/api/matches", matchesRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use(
  (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  },
);

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
