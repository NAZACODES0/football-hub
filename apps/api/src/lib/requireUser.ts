import type { RequestHandler } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "./auth";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

// Routes behind this need "Authorization: Bearer <token>" from a signed-in user.
export const requireUser: RequestHandler = async (req, res, next) => {
  // No credentials at all: answer right away without touching the database.
  if (!req.headers.authorization && !req.headers.cookie) {
    res.status(401).json({ error: "Sign in required" });
    return;
  }

  try {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    if (!session) {
      res.status(401).json({ error: "Sign in required" });
      return;
    }
    req.userId = session.user.id;
    next();
  } catch (err) {
    next(err);
  }
};
