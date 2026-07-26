import { describe, expect, it, vi } from "vitest";
import type { DetectedAgent } from "./types.js";
import { createIpRangeVerifier, ipInCidr, parseIp } from "./verify.js";

const gptbot: DetectedAgent = {
  slug: "gptbot",
  name: "GPTBot",
  operator: "OpenAI",
  category: "training",
  userAgent: "GPTBot/1.2",
};

describe("parseIp / ipInCidr", () => {
  it("matches IPv4 CIDRs", () => {
    expect(ipInCidr("52.230.152.10", "52.230.152.0/24")).toBe(true);
    expect(ipInCidr("52.230.153.10", "52.230.152.0/24")).toBe(false);
    expect(ipInCidr("10.0.0.1", "10.0.0.1")).toBe(true);
    expect(ipInCidr("10.0.0.1", "0.0.0.0/0")).toBe(true);
  });

  it("matches IPv6 CIDRs including :: compression", () => {
    expect(ipInCidr("2001:db8::1", "2001:db8::/32")).toBe(true);
    expect(ipInCidr("2001:db9::1", "2001:db8::/32")).toBe(false);
  });

  it("normalizes IPv4-mapped IPv6 addresses", () => {
    expect(ipInCidr("::ffff:52.230.152.10", "52.230.152.0/24")).toBe(true);
    expect(parseIp("::ffff:1.2.3.4")).toEqual({ family: 4, value: 0x01020304n });
  });

  it("rejects malformed input without throwing", () => {
    expect(parseIp("no-es-una-ip")).toBeNull();
    expect(parseIp("1.2.3.4.5")).toBeNull();
    expect(parseIp("2001:db8::1::2")).toBeNull();
    expect(ipInCidr("1.2.3.4", "basura")).toBe(false);
  });
});

describe("createIpRangeVerifier", () => {
  const ranges = { prefixes: [{ ipv4Prefix: "52.230.152.0/24" }, { ipv6Prefix: "2001:db8::/32" }] };

  it("verifies IPs inside published ranges and flags the rest as spoofed", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify(ranges)));
    const verify = createIpRangeVerifier({ fetchImpl: fetchImpl as unknown as typeof fetch });

    expect(await verify(gptbot, "52.230.152.10")).toBe("verified");
    expect(await verify(gptbot, "8.8.8.8")).toBe("spoofed");
    expect(await verify(gptbot, "2001:db8::99")).toBe("verified");
    // Ranges are cached: three checks, one fetch
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it("returns unverified for agents without published ranges or on fetch failure", async () => {
    const failing = vi.fn(async () => new Response("nope", { status: 500 }));
    const verify = createIpRangeVerifier({ fetchImpl: failing as unknown as typeof fetch });

    expect(await verify({ ...gptbot, slug: "ccbot" }, "1.2.3.4")).toBe("unverified");
    expect(await verify(gptbot, "1.2.3.4")).toBe("unverified");
  });
});
