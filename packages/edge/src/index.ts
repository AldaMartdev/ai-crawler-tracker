import {
  deliverEvent,
  eventFromRequest,
  type TrackerOptions,
} from "@ai-crawler-tracker/core";

type WaitUntil = (promise: Promise<unknown>) => void;

/**
 * Runtime-agnostic building block: detect, then deliver in the background.
 * Pass the platform's waitUntil so delivery survives after the response.
 */
export function trackAICrawlerEdge(
  request: Request,
  waitUntil: WaitUntil | undefined,
  options: TrackerOptions = {},
): void {
  const event = eventFromRequest(request, options);
  if (!event) return;

  const delivery = deliverEvent(event, options);
  waitUntil?.(delivery);
}

/**
 * Cloudflare Workers — call inside your fetch handler:
 *
 *   const track = createCloudflareTracker({ apiKey: env.AI_CRAWLER_API_KEY });
 *   export default {
 *     async fetch(request, env, ctx) {
 *       track(request, ctx);
 *       return handle(request);
 *     },
 *   };
 */
export function createCloudflareTracker(options: TrackerOptions = {}) {
  return function track(request: Request, ctx?: { waitUntil(promise: Promise<unknown>): void }): void {
    trackAICrawlerEdge(request, ctx ? ctx.waitUntil.bind(ctx) : undefined, options);
  };
}

/**
 * Vercel Edge Middleware — export as the middleware itself (returning
 * undefined continues the request):
 *
 *   export default createVercelEdgeTracker({ apiKey: process.env.AI_CRAWLER_API_KEY });
 */
export function createVercelEdgeTracker(options: TrackerOptions = {}) {
  return function middleware(
    request: Request,
    event?: { waitUntil(promise: Promise<unknown>): void },
  ): undefined {
    trackAICrawlerEdge(request, event ? event.waitUntil.bind(event) : undefined, options);
    return undefined;
  };
}

interface NetlifyContext {
  next(): Promise<Response>;
  waitUntil?(promise: Promise<unknown>): void;
}

/**
 * Netlify Edge Function — export as the handler and map it to "/*" in netlify.toml:
 *
 *   export default createNetlifyTracker({ apiKey: Netlify.env.get("AI_CRAWLER_API_KEY") });
 */
export function createNetlifyTracker(options: TrackerOptions = {}) {
  return function handler(request: Request, context: NetlifyContext): Promise<Response> {
    trackAICrawlerEdge(request, context.waitUntil?.bind(context), options);
    return context.next();
  };
}
