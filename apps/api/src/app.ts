import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { allowedOrigins } from "./lib/origins";
import { auth } from "./lib/auth";
import { competitionsRouter } from "./routes/competitions";
import { matchesRouter } from "./routes/matches";
import { teamsRouter } from "./routes/teams";
import { broadcastersRouter } from "./routes/broadcasters";
import { adminRouter } from "./routes/admin";
import { meRouter } from "./routes/me";
import { devRouter } from "./routes/dev";

dotenv.config({ path: "../../.env" });

export const app = express();

app.use(
  cors({
    origin: allowedOrigins(),
    credentials: true,
    exposedHeaders: ["set-auth-token"], // lets the website read the sign-in token
  }),
);

// Better Auth must be mounted BEFORE express.json().
app.all(/^\/api\/auth(\/.*)?$/, toNodeHandler(auth));

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/competitions", competitionsRouter);
app.use("/api/matches", matchesRouter);
app.use("/api/teams", teamsRouter);
app.use("/api/broadcasters", broadcastersRouter);
app.use("/api/admin", adminRouter);
app.use("/api/me", meRouter);

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
