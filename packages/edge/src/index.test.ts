import { describe, expect, it, vi } from "vitest";
import { createCloudflareTracker, createNetlifyTracker, createVercelEdgeTracker } from "./index.js";

function makeRequest(userAgent: string, ip = "52.230.152.10"): Request {
  return new Request("https://example.com/blog/post", {
    headers: { "user-agent": userAgent, "cf-connecting-ip": ip },
  });
}

describe("createCloudflareTracker", () => {
  it("delivers via ctx.waitUntil with the cf-connecting-ip", async () => {
    const onDetect = vi.fn();
    const waitUntil = vi.fn((p: Promise<unknown>) => p);

    createCloudflareTracker({ onDetect })(makeRequest("GPTBot/1.2"), { waitUntil });

    expect(waitUntil).toHaveBeenCalledOnce();
    await waitUntil.mock.calls[0][0];
    expect(onDetect.mock.calls[0][0]).toMatchObject({ path: "/blog/post", ip: "52.230.152.10" });
  });

  it("ignores human traffic", () => {
    const waitUntil = vi.fn();
    createCloudflareTracker({ onDetect: vi.fn() })(makeRequest("Mozilla/5.0 Chrome/126.0"), { waitUntil });
    expect(waitUntil).not.toHaveBeenCalled();
  });
});

describe("createVercelEdgeTracker", () => {
  it("returns undefined so the request continues", async () => {
    const onDetect = vi.fn();
    const waitUntil = vi.fn((p: Promise<unknown>) => p);

    const result = createVercelEdgeTracker({ onDetect })(makeRequest("ClaudeBot/1.0"), { waitUntil });

    expect(result).toBeUndefined();
    await waitUntil.mock.calls[0][0];
    expect(onDetect.mock.calls[0][0].agent.slug).toBe("claudebot");
  });
});

describe("createNetlifyTracker", () => {
  it("tracks and forwards to context.next()", async () => {
    const onDetect = vi.fn();
    const response = new Response("ok");
    const context = {
      next: vi.fn(async () => response),
      waitUntil: vi.fn((p: Promise<unknown>) => p),
    };

    const result = await createNetlifyTracker({ onDetect })(makeRequest("PerplexityBot/1.0"), context);

    expect(result).toBe(response);
    await context.waitUntil.mock.calls[0][0];
    expect(onDetect.mock.calls[0][0].agent.slug).toBe("perplexitybot");
  });

  it("still forwards when the runtime has no waitUntil", async () => {
    const context = { next: vi.fn(async () => new Response("ok")) };
    const result = await createNetlifyTracker({ onDetect: vi.fn() })(makeRequest("GPTBot/1.2"), context);
    expect(result.status).toBe(200);
  });
});
