import { detectAIAgent } from "./detect.js";
import { sendEvent, shouldIgnorePath } from "./send-event.js";
import type { CrawlEvent, TrackerOptions } from "./types.js";

const IP_HEADERS = ["cf-connecting-ip", "x-real-ip", "x-forwarded-for"];

export function ipFromHeaders(headers: { get(name: string): string | null }): string | undefined {
  for (const name of IP_HEADERS) {
    const value = headers.get(name);
    if (value) return value.split(",")[0].trim();
  }
  return undefined;
}

/** Builds a CrawlEvent from a fetch-standard Request, or null if not an AI crawler. */
export function eventFromRequest(request: Request, options: TrackerOptions = {}): CrawlEvent | null {
  const url = new URL(request.url);
  if (shouldIgnorePath(url.pathname, options.ignorePaths)) return null;

  const agent = detectAIAgent(request.headers.get("user-agent"), options.extraAgents);
  if (!agent) return null;

  return {
    agent,
    path: url.pathname,
    method: request.method,
    timestamp: new Date().toISOString(),
    referer: request.headers.get("referer") ?? undefined,
    host: url.host,
    ip: ipFromHeaders(request.headers),
  };
}

/** Runs the verifier (if any) and delivers the event. Never throws. */
export async function deliverEvent(event: CrawlEvent, options: TrackerOptions): Promise<void> {
  try {
    if (options.verifier && event.ip) {
      event.verification = await options.verifier(event.agent, event.ip);
    }
  } catch {
    event.verification = "unverified";
  }
  await sendEvent(event, options);
}
