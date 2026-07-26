import {
  deliverEvent,
  detectAIAgent,
  shouldIgnorePath,
  type CrawlEvent,
  type TrackerOptions,
} from "@ai-crawler-tracker/core";

interface ExpressRequestLike {
  path: string;
  method: string;
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
  socket?: { remoteAddress?: string };
}

function header(req: ExpressRequestLike, name: string): string | undefined {
  const value = req.headers[name];
  return Array.isArray(value) ? value[0] : value;
}

function clientIp(req: ExpressRequestLike): string | undefined {
  const forwarded = header(req, "x-forwarded-for");
  return req.ip ?? forwarded?.split(",")[0].trim() ?? req.socket?.remoteAddress;
}

/**
 * Usage:
 *
 *   import { aiCrawlerTracker } from "@ai-crawler-tracker/express";
 *   app.use(aiCrawlerTracker({ apiKey: process.env.AI_CRAWLER_API_KEY }));
 */
export function aiCrawlerTracker(options: TrackerOptions = {}) {
  return function aiCrawlerMiddleware(
    req: ExpressRequestLike,
    _res: unknown,
    next: (err?: unknown) => void,
  ): void {
    try {
      if (!shouldIgnorePath(req.path, options.ignorePaths)) {
        const agent = detectAIAgent(header(req, "user-agent"), options.extraAgents);
        if (agent) {
          const event: CrawlEvent = {
            agent,
            path: req.path,
            method: req.method,
            timestamp: new Date().toISOString(),
            referer: header(req, "referer"),
            host: header(req, "host"),
            ip: clientIp(req),
          };
          void deliverEvent(event, options);
        }
      }
    } catch {
      // Tracking must never break the host application.
    }
    next();
  };
}
