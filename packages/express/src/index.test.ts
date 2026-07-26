import { describe, expect, it, vi } from "vitest";
import { aiCrawlerTracker } from "./index.js";

function makeReq(userAgent: string, path = "/docs/api") {
  return {
    path,
    method: "GET",
    headers: { "user-agent": userAgent, host: "example.com" },
  };
}

describe("aiCrawlerTracker", () => {
  it("reports detected crawlers and always calls next", async () => {
    const onDetect = vi.fn();
    const next = vi.fn();

    aiCrawlerTracker({ onDetect })(makeReq("ClaudeBot/1.0; +claudebot@anthropic.com"), {}, next);

    expect(next).toHaveBeenCalledOnce();
    await vi.waitFor(() => expect(onDetect).toHaveBeenCalledOnce());
    const event = onDetect.mock.calls[0][0];
    expect(event.agent.slug).toBe("claudebot");
    expect(event.path).toBe("/docs/api");
    expect(event.host).toBe("example.com");
  });

  it("runs the verifier with the client IP before delivering", async () => {
    const onDetect = vi.fn();
    const verifier = vi.fn(async () => "verified" as const);
    const req = { ...makeReq("GPTBot/1.2"), ip: "52.230.152.10" };

    aiCrawlerTracker({ onDetect, verifier })(req, {}, vi.fn());

    await vi.waitFor(() => expect(onDetect).toHaveBeenCalledOnce());
    expect(verifier).toHaveBeenCalledWith(expect.objectContaining({ slug: "gptbot" }), "52.230.152.10");
    expect(onDetect.mock.calls[0][0]).toMatchObject({ ip: "52.230.152.10", verification: "verified" });
  });

  it("skips human traffic but still calls next", () => {
    const onDetect = vi.fn();
    const next = vi.fn();

    aiCrawlerTracker({ onDetect })(makeReq("Mozilla/5.0 Chrome/126.0"), {}, next);

    expect(next).toHaveBeenCalledOnce();
    expect(onDetect).not.toHaveBeenCalled();
  });
});
