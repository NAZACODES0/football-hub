"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="rounded-lg border border-red-900 bg-red-950/40 p-6">
      <h2 className="mb-2 text-lg font-semibold">Something went wrong</h2>
      <p className="mb-4 text-sm text-slate-300">
        The data could not be loaded. Make sure the API is running (pnpm dev:api).
      </p>
      <button
        onClick={reset}
        className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium hover:bg-emerald-500"
      >
        Try again
      </button>
    </div>
  );
}
