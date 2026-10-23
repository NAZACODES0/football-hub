import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "./app";
import { redis } from "./lib/redis";

afterAll(async () => {
  await redis.quit().catch(() => undefined);
});

// These tests only exercise routing and validation, so they never need database rows.
describe("API", () => {
  it("answers the health check", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("returns a JSON 404 for unknown routes", async () => {
    const res = await request(app).get("/api/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Not found" });
  });

  it("rejects a malformed date", async () => {
    const res = await request(app).get("/api/matches?date=nope");
    expect(res.status).toBe(400);
  });

  it("rejects an unknown match status", async () => {
    const res = await request(app).get("/api/matches?status=NOPE");
    expect(res.status).toBe(400);
  });

  it("rejects a non-numeric match id", async () => {
    const res = await request(app).get("/api/matches/abc");
    expect(res.status).toBe(400);
  });

  it("rejects a non-numeric team id", async () => {
    const res = await request(app).get("/api/teams/abc");
    expect(res.status).toBe(400);
  });

  it("keeps admin routes closed without a token", async () => {
    const res = await request(app).get("/api/admin/check");
    expect([401, 503]).toContain(res.status);
  });

  it("rejects a wrong admin token", async () => {
    const res = await request(app)
      .get("/api/admin/check")
      .set("Authorization", "Bearer definitely-not-the-token");
    expect([401, 503]).toContain(res.status);
  });
});

describe("accounts", () => {
  it("asks for sign-in on the favorites list", async () => {
    const res = await request(app).get("/api/me/favorites");
    expect(res.status).toBe(401);
  });

  it("asks for sign-in before adding a favorite", async () => {
    const res = await request(app).put("/api/me/favorites/1");
    expect(res.status).toBe(401);
  });
});
