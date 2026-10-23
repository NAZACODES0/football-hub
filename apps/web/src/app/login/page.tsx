"use client";

import { useState } from "react";
import { authClient } from "@/lib/authClient";
import { MERGE_FLAG } from "@/lib/favoritesApi";

const inputCls = "w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm";

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");

    const result =
      mode === "signup"
        ? await authClient.signUp.email({
            name: name.trim() || email.split("@")[0],
            email,
            password,
          })
        : await authClient.signIn.email({ email, password });

    if (result.error) {
      setError(result.error.message ?? "Something went wrong. Please try again.");
      setBusy(false);
      return;
    }

    try {
      window.localStorage.setItem(MERGE_FLAG, "1"); // merge this browser's favorites once
    } catch {
      // storage blocked
    }
    window.location.assign("/favorites"); // a fresh load starts everything with the new token
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-1 text-2xl font-bold">{mode === "signin" ? "Sign in" : "Create account"}</h1>
      <p className="mb-4 text-sm text-slate-400">
        An account keeps your favorite teams on all your devices.
      </p>

      {error ? <p className="mb-4 rounded bg-red-950 p-3 text-sm text-red-300">{error}</p> : null}

      <form onSubmit={submit} className="space-y-3">
        {mode === "signup" ? (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            autoComplete="name"
            className={inputCls}
          />
        ) : null}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          autoComplete="email"
          required
          className={inputCls}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password (at least 8 characters)"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          minLength={8}
          required
          className={inputCls}
        />
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded bg-emerald-600 px-4 py-2 text-sm font-medium hover:bg-emerald-500 disabled:opacity-50"
        >
          {busy ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>

      <button
        onClick={() => {
          setMode(mode === "signin" ? "signup" : "signin");
          setError("");
        }}
        className="mt-4 text-sm text-slate-400 hover:text-white"
      >
        {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
      </button>
    </div>
  );
}
