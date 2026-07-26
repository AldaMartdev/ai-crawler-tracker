import type { CrawlEvent, TrackerOptions } from "./types.js";

/**
 * Fire-and-forget delivery: never throws and never blocks the response.
 * Callers on edge runtimes should pass the returned promise to waitUntil().
 */
export async function sendEvent(event: CrawlEvent, options: TrackerOptions): Promise<void> {
  try {
    if (options.onDetect) await options.onDetect(event);
    if (options.endpoint) {
      await fetch(options.endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(options.apiKey ? { authorization: `Bearer ${options.apiKey}` } : {}),
        },
        body: JSON.stringify(event),
        keepalive: true,
      });
    }
  } catch {
    // Tracking must never break the host application.
  }
}

export function shouldIgnorePath(path: string, ignorePaths: string[] = []): boolean {
  const defaults = ["/_next/", "/favicon.ico", "/robots.txt"];
  return [...defaults, ...ignorePaths].some((p) => path.startsWith(p));
}
