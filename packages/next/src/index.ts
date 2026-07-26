import {
  deliverEvent,
  eventFromRequest,
  type TrackerOptions,
} from "@ai-crawler-tracker/core";

interface WaitUntilEvent {
  waitUntil(promise: Promise<unknown>): void;
}

/**
 * Detects an AI crawler on a request and reports it without blocking.
 * Compose it inside an existing proxy.ts / middleware.ts:
 *
 *   export function proxy(request: NextRequest, event: NextFetchEvent) {
 *     trackAICrawler(request, event, { apiKey: process.env.AI_CRAWLER_API_KEY });
 *     return NextResponse.next();
 *   }
 */
export function trackAICrawler(
  request: Request,
  event: WaitUntilEvent | undefined,
  options: TrackerOptions = {},
): void {
  const crawlEvent = eventFromRequest(request, options);
  if (!crawlEvent) return;

  const delivery = deliverEvent(crawlEvent, options);
  if (event) event.waitUntil(delivery);
}

/**
 * Standalone proxy/middleware. Returning undefined lets Next.js continue
 * the request normally, so no dependency on next/server is needed:
 *
 *   // proxy.ts (middleware.ts before Next.js 16)
 *   export const proxy = createAITracker({ apiKey: process.env.AI_CRAWLER_API_KEY });
 */
export function createAITracker(options: TrackerOptions = {}) {
  return function aiTrackerProxy(request: Request, event?: WaitUntilEvent): undefined {
    trackAICrawler(request, event, options);
    return undefined;
  };
}
