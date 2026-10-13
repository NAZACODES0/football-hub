import type { Highlight } from "@/lib/types";

export function Highlights({ highlights }: { highlights: Highlight[] }) {
  if (highlights.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-lg font-semibold">Highlights</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {highlights.map((h) => (
          <div key={h.id}>
            <div className="aspect-video overflow-hidden rounded-lg border border-slate-800">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${h.youtubeVideoId}`}
                title={h.title ?? "Match highlights"}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
            {h.title ? <p className="mt-2 text-sm text-slate-300">{h.title}</p> : null}
          </div>
        ))}
      </div>
    </section>
  );
}
