import type { DetectedAgent, VerificationStatus } from "./types.js";

export interface VerificationSource {
  /** JSON with { prefixes: [{ ipv4Prefix | ipv6Prefix }] } published by the operator */
  ipRangesUrl?: string;
  /** Reverse-DNS hostname suffixes owned by the operator (forward-confirmed) */
  rdnsSuffixes?: string[];
}

/** Where each agent CAN be verified. Agents not listed here are unverifiable. */
export const VERIFICATION_SOURCES: Record<string, VerificationSource> = {
  gptbot: { ipRangesUrl: "https://openai.com/gptbot.json" },
  "oai-searchbot": { ipRangesUrl: "https://openai.com/searchbot.json" },
  "chatgpt-user": { ipRangesUrl: "https://openai.com/chatgpt-user.json" },
  perplexitybot: { ipRangesUrl: "https://www.perplexity.ai/perplexitybot.json" },
  "perplexity-user": { ipRangesUrl: "https://www.perplexity.ai/perplexity-user.json" },
  googleother: { rdnsSuffixes: [".googlebot.com", ".google.com"] },
  "google-cloudvertexbot": { rdnsSuffixes: [".googlebot.com", ".google.com"] },
  applebot: { rdnsSuffixes: [".applebot.apple.com"] },
  amazonbot: { rdnsSuffixes: [".crawl.amazonbot.amazon"] },
  bytespider: { rdnsSuffixes: [".bytedance.com"] },
  petalbot: { rdnsSuffixes: [".petalsearch.com", ".aspiegel.com"] },
  duckassistbot: { rdnsSuffixes: [".duckduckgo.com"] },
};

interface ParsedIp {
  family: 4 | 6;
  value: bigint;
}

function parseIpv4(ip: string): bigint | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let value = 0n;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part) || Number(part) > 255) return null;
    value = (value << 8n) | BigInt(Number(part));
  }
  return value;
}

function parseIpv6(ip: string): bigint | null {
  const zone = ip.indexOf("%");
  if (zone >= 0) ip = ip.slice(0, zone);
  const dc = ip.indexOf("::");
  if (dc >= 0 && ip.indexOf("::", dc + 1) >= 0) return null;
  const [head, tail] = dc >= 0 ? [ip.slice(0, dc), ip.slice(dc + 2)] : [ip, ""];

  const parseGroups = (segment: string): bigint[] | null => {
    if (segment === "") return [];
    const groups = segment.split(":");
    const out: bigint[] = [];
    for (let i = 0; i < groups.length; i++) {
      const g = groups[i];
      if (g.includes(".")) {
        // Embedded IPv4, only allowed as the final group pair
        if (i !== groups.length - 1) return null;
        const v4 = parseIpv4(g);
        if (v4 === null) return null;
        out.push((v4 >> 16n) & 0xffffn, v4 & 0xffffn);
      } else {
        if (!/^[0-9a-fA-F]{1,4}$/.test(g)) return null;
        out.push(BigInt(parseInt(g, 16)));
      }
    }
    return out;
  };

  const h = parseGroups(head);
  const t = parseGroups(tail);
  if (!h || !t) return null;
  const missing = 8 - h.length - t.length;
  if (dc >= 0 ? missing < 0 : missing !== 0) return null;

  const groups = [...h, ...Array<bigint>(dc >= 0 ? missing : 0).fill(0n), ...t];
  let value = 0n;
  for (const g of groups) value = (value << 16n) | g;
  return value;
}

export function parseIp(ip: string): ParsedIp | null {
  if (ip.includes(":")) {
    const value = parseIpv6(ip);
    if (value === null) return null;
    // Normalize IPv4-mapped addresses (::ffff:1.2.3.4) to IPv4
    if (value >> 32n === 0xffffn) return { family: 4, value: value & 0xffffffffn };
    return { family: 6, value };
  }
  const value = parseIpv4(ip);
  return value === null ? null : { family: 4, value };
}

export function ipInCidr(ip: string, cidr: string): boolean {
  const [base, prefixStr] = cidr.split("/");
  const a = parseIp(ip);
  const b = parseIp(base);
  if (!a || !b || a.family !== b.family) return false;
  const bits = a.family === 4 ? 32 : 128;
  const prefix = prefixStr === undefined ? bits : Number(prefixStr);
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > bits) return false;
  const shift = BigInt(bits - prefix);
  return a.value >> shift === b.value >> shift;
}

export function ipInAnyCidr(ip: string, cidrs: string[]): boolean {
  return cidrs.some((cidr) => ipInCidr(ip, cidr));
}

export interface IpRangeVerifierOptions {
  /** How long fetched IP ranges are cached in memory. Default: 24 h */
  cacheTtlMs?: number;
  fetchImpl?: typeof fetch;
}

/**
 * Verifier based on the operator's published IP ranges. Works in any runtime
 * with fetch (Node, Cloudflare Workers, Vercel/Netlify Edge). Agents without
 * published ranges resolve to "unverified" — combine with createNodeVerifier()
 * on Node for reverse-DNS coverage.
 */
export function createIpRangeVerifier(options: IpRangeVerifierOptions = {}) {
  const ttl = options.cacheTtlMs ?? 86_400_000;
  const cache = new Map<string, { at: number; cidrs: string[] }>();

  return async function verifyByIpRanges(
    agent: DetectedAgent,
    ip: string,
  ): Promise<VerificationStatus> {
    const source = VERIFICATION_SOURCES[agent.slug];
    if (!source?.ipRangesUrl || !ip) return "unverified";
    try {
      let entry = cache.get(source.ipRangesUrl);
      if (!entry || Date.now() - entry.at > ttl) {
        const res = await (options.fetchImpl ?? fetch)(source.ipRangesUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as {
          prefixes?: { ipv4Prefix?: string; ipv6Prefix?: string }[];
        };
        const cidrs = (data.prefixes ?? [])
          .map((p) => p.ipv4Prefix ?? p.ipv6Prefix)
          .filter((c): c is string => Boolean(c));
        entry = { at: Date.now(), cidrs };
        cache.set(source.ipRangesUrl, entry);
      }
      return ipInAnyCidr(ip, entry.cidrs) ? "verified" : "spoofed";
    } catch {
      return "unverified";
    }
  };
}
