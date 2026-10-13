/* eslint-disable @next/next/no-img-element */
export function Crest({
  src,
  alt,
  size = 28,
}: {
  src: string | null;
  alt: string;
  size?: number;
}) {
  if (!src) {
    return (
      <div style={{ width: size, height: size }} className="shrink-0 rounded-full bg-slate-700" />
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      style={{ width: size, height: size }}
      className="shrink-0 object-contain"
    />
  );
}
