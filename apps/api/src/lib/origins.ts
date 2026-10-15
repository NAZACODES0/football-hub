const DEFAULT_ORIGIN = "http://localhost:3000";

// CORS_ORIGIN can hold one site or several, separated by commas.
export function allowedOrigins(): string[] {
  const raw = process.env.CORS_ORIGIN ?? DEFAULT_ORIGIN;
  return raw
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter((origin) => origin.length > 0);
}
