export default function Loading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-6 w-40 rounded bg-slate-800" />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-24 rounded-lg bg-slate-800" />
        <div className="h-24 rounded-lg bg-slate-800" />
        <div className="h-24 rounded-lg bg-slate-800" />
        <div className="h-24 rounded-lg bg-slate-800" />
      </div>
    </div>
  );
}
