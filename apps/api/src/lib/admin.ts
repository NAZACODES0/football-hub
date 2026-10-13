import { timingSafeEqual } from "crypto";
import type { RequestHandler } from "express";

// Admin routes need "Authorization: Bearer <ADMIN_TOKEN>".
export const requireAdmin: RequestHandler = (req, res, next) => {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected || expected === "change_me") {
    res.status(503).json({ error: "ADMIN_TOKEN is not configured on the server" });
    return;
  }

  const header = req.header("authorization") ?? "";
  const given = header.startsWith("Bearer ") ? header.slice(7) : "";
  const a = Buffer.from(given);
  const b = Buffer.from(expected);

  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
};
