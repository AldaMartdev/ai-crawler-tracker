import type { CrawlEvent } from "@ai-crawler-tracker/core";
import { AI_AGENTS } from "@ai-crawler-tracker/core";
import type { SqliteStore } from "@ai-crawler-tracker/sqlite";

const DEMO_PATHS = [
  "/blog/inteligencia-artificial",
  "/blog/como-funciona-rag",
  "/productos/analytics",
  "/documentacion/api",
  "/documentacion/instalacion",
  "/precios",
  "/",
];

const DEMO_AGENT_WEIGHTS: [slug: string, weight: number][] = [
  ["gptbot", 34],
  ["claudebot", 22],
  ["perplexitybot", 14],
  ["oai-searchbot", 9],
  ["chatgpt-user", 7],
  ["claude-user", 5],
  ["bytespider", 4],
  ["amazonbot", 3],
  ["ccbot", 2],
];

export function seedDemoData(store: SqliteStore, days = 30, perDay = 12): void {
  const totalWeight = DEMO_AGENT_WEIGHTS.reduce((sum, [, w]) => sum + w, 0);

  for (let d = 0; d < days; d++) {
    // Light upward trend so the daily chart has a shape
    const count = Math.round(perDay * (0.6 + (0.8 * (days - d)) / days) * (0.7 + Math.random() * 0.6));
    for (let i = 0; i < count; i++) {
      let pick = Math.random() * totalWeight;
      const slug = DEMO_AGENT_WEIGHTS.find(([, w]) => (pick -= w) < 0)?.[0] ?? "gptbot";
      const agent = AI_AGENTS.find((a) => a.slug === slug)!;
      const ts = new Date(Date.now() - d * 86_400_000 - Math.random() * 86_400_000);
      const verifiable = ["gptbot", "oai-searchbot", "chatgpt-user", "perplexitybot", "amazonbot", "bytespider"].includes(slug);
      const event: CrawlEvent = {
        agent: { ...agent, userAgent: `${agent.name}/1.0 (demo)` },
        path: DEMO_PATHS[Math.floor(Math.random() ** 1.6 * DEMO_PATHS.length)],
        method: "GET",
        timestamp: ts.toISOString(),
        host: "demo.ejemplo.com",
        ip: `52.230.${Math.floor(Math.random() * 8)}.${Math.floor(Math.random() * 255)}`,
        verification: !verifiable ? "unverified" : Math.random() < 0.94 ? "verified" : "spoofed",
      };
      store.insert(event);
    }
  }
}
