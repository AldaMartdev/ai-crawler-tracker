import { describe, expect, it } from "vitest";
import { detectAIAgent } from "./detect.js";
import { shouldIgnorePath } from "./send-event.js";

describe("detectAIAgent", () => {
  it("detects GPTBot", () => {
    const agent = detectAIAgent(
      "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.2; +https://openai.com/gptbot",
    );
    expect(agent?.slug).toBe("gptbot");
    expect(agent?.operator).toBe("OpenAI");
    expect(agent?.category).toBe("training");
  });

  it("detects ClaudeBot", () => {
    const agent = detectAIAgent(
      "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)",
    );
    expect(agent?.slug).toBe("claudebot");
  });

  it("detects PerplexityBot vs Perplexity-User", () => {
    expect(detectAIAgent("Mozilla/5.0; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot")?.slug).toBe(
      "perplexitybot",
    );
    expect(detectAIAgent("Mozilla/5.0; Perplexity-User/1.0; +https://perplexity.ai/perplexity-user")?.slug).toBe(
      "perplexity-user",
    );
  });

  it("does not flag ChatGPT-User as GPTBot", () => {
    const agent = detectAIAgent(
      "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot",
    );
    expect(agent?.slug).toBe("chatgpt-user");
  });

  it("returns null for regular browsers", () => {
    expect(
      detectAIAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
      ),
    ).toBeNull();
    expect(detectAIAgent(null)).toBeNull();
    expect(detectAIAgent("")).toBeNull();
  });

  it("supports extra agents", () => {
    const agent = detectAIAgent("MyCustomBot/2.0", [
      { slug: "mycustombot", name: "MyCustomBot", operator: "Acme", category: "search", pattern: "mycustombot" },
    ]);
    expect(agent?.slug).toBe("mycustombot");
  });
});

describe("shouldIgnorePath", () => {
  it("ignores framework internals by default", () => {
    expect(shouldIgnorePath("/_next/static/chunk.js")).toBe(true);
    expect(shouldIgnorePath("/favicon.ico")).toBe(true);
    expect(shouldIgnorePath("/blog/post")).toBe(false);
  });

  it("supports custom prefixes", () => {
    expect(shouldIgnorePath("/api/health", ["/api/"])).toBe(true);
  });
});
