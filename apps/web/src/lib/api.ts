const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// Returns the parsed JSON, or null if the API answers 404.
// Throws on any other failure, which shows the error page.
export async function apiGet<T>(path: string): Promise<T | null> {
  const res = await fetch(`${API_URL}${path}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`API responded ${res.status} for ${path}`);
  return (await res.json()) as T;
}
