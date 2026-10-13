"use client";

import { useState } from "react";
import type { Broadcaster, Competition, Highlight, Match } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type AdminBroadcaster = Broadcaster & {
  competition: { code: string | null; name: string } | null;
};

async function adminApi<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  });
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((body as { error?: string }).error ?? `Request failed (${res.status})`);
  }
  return body as T;
}

async function publicApi<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return (await res.json()) as T;
}

const inputCls = "w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm";
const buttonCls =
  "rounded bg-emerald-600 px-4 py-2 text-sm font-medium hover:bg-emerald-500 disabled:opacity-50";
const cardCls = "mb-8 rounded-lg border border-slate-800 bg-slate-900 p-4";

export default function AdminPage() {
  const [tokenInput, setTokenInput] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const [matches, setMatches] = useState<Match[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [broadcasters, setBroadcasters] = useState<AdminBroadcaster[]>([]);

  const [matchId, setMatchId] = useState("");
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [video, setVideo] = useState("");
  const [title, setTitle] = useState("");

  const [bName, setBName] = useState("");
  const [bCountry, setBCountry] = useState("");
  const [bUrl, setBUrl] = useState("");
  const [bComp, setBComp] = useState("");

  async function run(task: () => Promise<void>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await task();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function login(e: React.FormEvent) {
    e.preventDefault();
    await run(async () => {
      await adminApi("/api/admin/check", tokenInput);
      const [ms, cs, bs] = await Promise.all([
        publicApi<Match[]>("/api/matches?status=FINISHED&order=desc&limit=50"),
        publicApi<Competition[]>("/api/competitions"),
        adminApi<AdminBroadcaster[]>("/api/admin/broadcasters", tokenInput),
      ]);
      setMatches(ms);
      setCompetitions(cs);
      setBroadcasters(bs);
      setToken(tokenInput);
    });
  }

  async function loadHighlights(id: string) {
    if (!token || !id) {
      setHighlights([]);
      return;
    }
    setHighlights(await adminApi<Highlight[]>(`/api/admin/highlights?matchId=${id}`, token));
  }

  async function addHighlight(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    await run(async () => {
      await adminApi("/api/admin/highlights", token, {
        method: "POST",
        body: JSON.stringify({ matchId: Number(matchId), video, title }),
      });
      setVideo("");
      setTitle("");
      await loadHighlights(matchId);
      setNotice("Highlight added.");
    });
  }

  async function removeHighlight(id: number) {
    if (!token) return;
    await run(async () => {
      await adminApi(`/api/admin/highlights/${id}`, token, { method: "DELETE" });
      await loadHighlights(matchId);
      setNotice("Highlight removed.");
    });
  }

  async function addBroadcaster(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    await run(async () => {
      await adminApi("/api/admin/broadcasters", token, {
        method: "POST",
        body: JSON.stringify({ name: bName, country: bCountry, url: bUrl, competition: bComp }),
      });
      setBName("");
      setBUrl("");
      setBroadcasters(await adminApi<AdminBroadcaster[]>("/api/admin/broadcasters", token));
      setNotice("Broadcaster added.");
    });
  }

  async function removeBroadcaster(id: number) {
    if (!token) return;
    await run(async () => {
      await adminApi(`/api/admin/broadcasters/${id}`, token, { method: "DELETE" });
      setBroadcasters(await adminApi<AdminBroadcaster[]>("/api/admin/broadcasters", token));
      setNotice("Broadcaster removed.");
    });
  }

  const feedback = (
    <>
      {error ? <p className="mb-4 rounded bg-red-950 p-3 text-sm text-red-300">{error}</p> : null}
      {notice ? (
        <p className="mb-4 rounded bg-emerald-950 p-3 text-sm text-emerald-300">{notice}</p>
      ) : null}
    </>
  );

  if (!token) {
    return (
      <div className="mx-auto max-w-sm">
        <h1 className="mb-4 text-2xl font-bold">Admin</h1>
        {feedback}
        <form onSubmit={login} className="space-y-3">
          <input
            type="password"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="Admin token"
            className={inputCls}
          />
          <button type="submit" disabled={busy || tokenInput.length === 0} className={buttonCls}>
            Sign in
          </button>
        </form>
        <p className="mt-3 text-xs text-slate-500">
          The token is the ADMIN_TOKEN value in your .env file.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin</h1>
        <button
          onClick={() => setToken(null)}
          className="text-sm text-slate-400 hover:text-white"
        >
          Sign out
        </button>
      </div>
      {feedback}

      <section className={cardCls}>
        <h2 className="mb-1 text-lg font-semibold">Match highlights</h2>
        <p className="mb-3 text-xs text-slate-400">
          Only add videos from official league or club YouTube channels.
        </p>
        <select
          value={matchId}
          onChange={(e) => {
            setMatchId(e.target.value);
            void run(() => loadHighlights(e.target.value));
          }}
          className={`${inputCls} mb-3`}
        >
          <option value="">Choose a finished match...</option>
          {matches.map((m) => (
            <option key={m.id} value={m.id}>
              {`${m.homeTeam.shortName ?? m.homeTeam.name} ${m.homeScore ?? "-"}-${m.awayScore ?? "-"} ${m.awayTeam.shortName ?? m.awayTeam.name} (${m.kickoffAt.slice(0, 10)})`}
            </option>
          ))}
        </select>

        {matchId ? (
          <>
            {highlights.length > 0 ? (
              <ul className="mb-3 space-y-1 text-sm">
                {highlights.map((h) => (
                  <li key={h.id} className="flex items-center justify-between rounded bg-slate-800 px-3 py-2">
                    <span>{h.title ?? h.youtubeVideoId}</span>
                    <button
                      onClick={() => void removeHighlight(h.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mb-3 text-sm text-slate-400">No highlights on this match yet.</p>
            )}
            <form onSubmit={addHighlight} className="space-y-3">
              <input
                value={video}
                onChange={(e) => setVideo(e.target.value)}
                placeholder="YouTube link or video id"
                className={inputCls}
              />
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title (optional)"
                className={inputCls}
              />
              <button type="submit" disabled={busy || video.length === 0} className={buttonCls}>
                Add highlight
              </button>
            </form>
          </>
        ) : null}
      </section>

      <section className={cardCls}>
        <h2 className="mb-1 text-lg font-semibold">Where to watch</h2>
        <p className="mb-3 text-xs text-slate-400">
          Copy these from the league&apos;s official broadcast page. Leave the competition empty to
          show a broadcaster on every competition.
        </p>

        {broadcasters.length > 0 ? (
          <ul className="mb-4 space-y-1 text-sm">
            {broadcasters.map((b) => (
              <li key={b.id} className="flex items-center justify-between rounded bg-slate-800 px-3 py-2">
                <span>
                  {b.country}: {b.name}
                  {b.competition?.code ? ` (${b.competition.code})` : ""}
                </span>
                <button
                  onClick={() => void removeBroadcaster(b.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <form onSubmit={addBroadcaster} className="grid gap-3 sm:grid-cols-2">
          <input
            value={bName}
            onChange={(e) => setBName(e.target.value)}
            placeholder="Broadcaster name"
            className={inputCls}
          />
          <input
            value={bCountry}
            onChange={(e) => setBCountry(e.target.value)}
            placeholder="Country (e.g. United Kingdom)"
            className={inputCls}
          />
          <input
            value={bUrl}
            onChange={(e) => setBUrl(e.target.value)}
            placeholder="https://..."
            className={inputCls}
          />
          <select value={bComp} onChange={(e) => setBComp(e.target.value)} className={inputCls}>
            <option value="">All competitions</option>
            {competitions
              .filter((c) => c.code)
              .map((c) => (
                <option key={c.id} value={c.code ?? ""}>
                  {c.name}
                </option>
              ))}
          </select>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={busy || !bName || !bCountry || !bUrl}
              className={buttonCls}
            >
              Add broadcaster
            </button>
          </div>
        </form>
      </section>
    </>
  );
}
