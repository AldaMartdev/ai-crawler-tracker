import { describe, expect, it, vi } from "vitest";
import { createAITracker } from "./index.js";

function makeRequest(userAgent: string, path = "/blog/post"): Request {
  return new Request(`https://example.com${path}`, {
    headers: { "user-agent": userAgent },
  });
}

describe("createAITracker", () => {
  it("reports detected crawlers via onDetect and waitUntil", async () => {
    const onDetect = vi.fn();
    const waitUntil = vi.fn((p: Promise<unknown>) => p);
    const proxy = createAITracker({ onDetect });

    proxy(makeRequest("GPTBot/1.2; +https://openai.com/gptbot"), { waitUntil });

    expect(waitUntil).toHaveBeenCalledOnce();
    await waitUntil.mock.calls[0][0];
    expect(onDetect).toHaveBeenCalledOnce();
    const event = onDetect.mock.calls[0][0];
    expect(event.agent.slug).toBe("gptbot");
    expect(event.path).toBe("/blog/post");
    expect(event.host).toBe("example.com");
  });

  it("ignores human traffic and internal paths", () => {
    const onDetect = vi.fn();
    const waitUntil = vi.fn();
    const proxy = createAITracker({ onDetect });

    proxy(makeRequest("Mozilla/5.0 Chrome/126.0"), { waitUntil });
    proxy(makeRequest("GPTBot/1.2", "/_next/static/x.js"), { waitUntil });

    expect(waitUntil).not.toHaveBeenCalled();
    expect(onDetect).not.toHaveBeenCalled();
  });

  it("returns undefined so Next.js continues the chain", () => {
    const proxy = createAITracker();
    expect(proxy(makeRequest("GPTBot/1.2"))).toBeUndefined();
  });
});
