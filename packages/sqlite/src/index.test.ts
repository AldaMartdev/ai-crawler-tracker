import { describe, expect, it } from "vitest";
import type { CrawlEvent } from "@ai-crawler-tracker/core";
import { createSqliteStore } from "./index.js";

function makeEvent(overrides: Partial<CrawlEvent> & { slug?: string; path?: string } = {}): CrawlEvent {
  const slug = overrides.slug ?? "gptbot";
  return {
    agent: {
      slug,
      name: slug === "gptbot" ? "GPTBot" : "ClaudeBot",
      operator: slug === "gptbot" ? "OpenAI" : "Anthropic",
      category: "training",
      userAgent: `${slug}/1.0`,
    },
    path: overrides.path ?? "/blog/post",
    method: "GET",
    timestamp: overrides.timestamp ?? new Date().toISOString(),
    host: "example.com",
  };
}

describe("createSqliteStore", () => {
  it("stores events via onDetect and aggregates by agent", () => {
    const store = createSqliteStore({ path: ":memory:" });

    store.onDetect(makeEvent());
    store.onDetect(makeEvent());
    store.onDetect(makeEvent({ slug: "claudebot" }));

    const agents = store.countsByAgent();
    expect(agents).toHaveLength(2);
    expect(agents[0]).toMatchObject({ slug: "gptbot", name: "GPTBot", count: 2 });
    expect(store.totalEvents()).toBe(3);
    store.close();
  });

  it("aggregates by page and lists recent events", () => {
    const store = createSqliteStore({ path: ":memory:" });

    store.insert(makeEvent({ path: "/docs" }));
    store.insert(makeEvent({ path: "/docs" }));
    store.insert(makeEvent({ path: "/precios", slug: "claudebot" }));

    const pages = store.countsByPage();
    expect(pages[0]).toMatchObject({ path: "/docs", agentName: "GPTBot", count: 2 });

    const recent = store.recentEvents(2);
    expect(recent).toHaveLength(2);
    expect(recent[0].path).toBe("/precios");
    store.close();
  });

  it("filters by date and buckets daily counts", () => {
    const store = createSqliteStore({ path: ":memory:" });
    const today = new Date().toISOString();

    store.insert(makeEvent({ timestamp: "2020-01-01T00:00:00.000Z" }));
    store.insert(makeEvent({ timestamp: today }));

    expect(store.totalEvents("2025-01-01")).toBe(1);
    const daily = store.dailyCounts(7);
    expect(daily).toHaveLength(1);
    expect(daily[0]).toMatchObject({ day: today.slice(0, 10), count: 1 });
    store.close();
  });
});
