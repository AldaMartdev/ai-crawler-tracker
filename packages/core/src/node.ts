import { lookup, reverse } from "node:dns/promises";
import type { DetectedAgent, VerificationStatus } from "./types.js";
import {
  createIpRangeVerifier,
  VERIFICATION_SOURCES,
  type IpRangeVerifierOptions,
} from "./verify.js";

/**
 * Full verifier for Node runtimes: published IP ranges where available,
 * forward-confirmed reverse DNS for the rest (Google, Apple, Amazon, ...).
 * Not usable on edge runtimes — use createIpRangeVerifier() there.
 */
export function createNodeVerifier(options: IpRangeVerifierOptions = {}) {
  const byIpRanges = createIpRangeVerifier(options);

  return async function verifyAgent(
    agent: DetectedAgent,
    ip: string,
  ): Promise<VerificationStatus> {
    const source = VERIFICATION_SOURCES[agent.slug];
    if (!source || !ip) return "unverified";
    if (source.ipRangesUrl) return byIpRanges(agent, ip);

    try {
      const hostnames = await reverse(ip);
      const match = hostnames.find((h) =>
        source.rdnsSuffixes!.some((suffix) => h === suffix.slice(1) || h.endsWith(suffix)),
      );
      if (!match) return "spoofed";
      // Forward-confirm: the claimed hostname must resolve back to the same IP
      const addresses = await lookup(match, { all: true });
      return addresses.some((a) => a.address === ip) ? "verified" : "spoofed";
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      // No PTR record at all is a strong spoofing signal; transient failures are not
      return code === "ENOTFOUND" || code === "ENODATA" ? "spoofed" : "unverified";
    }
  };
}
