export type AgentCategory =
  /** Crawls content to train foundation models */
  | "training"
  /** Indexes content for AI-powered search products */
  | "search"
  /** Fetches a page live on behalf of an end user (e.g. ChatGPT browsing) */
  | "assistant";

export interface AgentSignature {
  /** Stable identifier, e.g. "gptbot" */
  slug: string;
  /** Display name, e.g. "GPTBot" */
  name: string;
  /** Company operating the crawler */
  operator: string;
  category: AgentCategory;
  /** Case-insensitive substring matched against the User-Agent header */
  pattern: string;
}

export interface DetectedAgent {
  slug: string;
  name: string;
  operator: string;
  category: AgentCategory;
  userAgent: string;
}

export type VerificationStatus =
  /** The IP matches the operator's published ranges or forward-confirmed reverse DNS */
  | "verified"
  /** The check ran and the IP does NOT belong to the claimed operator */
  | "spoofed"
  /** No verification data exists for this agent, or the check could not run */
  | "unverified";

export interface CrawlEvent {
  agent: DetectedAgent;
  path: string;
  method: string;
  timestamp: string;
  referer?: string;
  host?: string;
  ip?: string;
  verification?: VerificationStatus;
}

export interface TrackerOptions {
  /** Endpoint that receives crawl events as JSON POSTs. If omitted, events are only passed to onDetect. */
  endpoint?: string;
  /** Sent as Authorization: Bearer <apiKey> to the endpoint */
  apiKey?: string;
  /** Called for every detected crawl, e.g. to store events yourself */
  onDetect?: (event: CrawlEvent) => void | Promise<void>;
  /** Path prefixes to skip, e.g. ["/_next", "/static"] */
  ignorePaths?: string[];
  /** Additional signatures to detect beyond the built-in list */
  extraAgents?: AgentSignature[];
  /**
   * Verifies that the request IP really belongs to the claimed operator.
   * Use createIpRangeVerifier() (any runtime) or createNodeVerifier()
   * from "@ai-crawler-tracker/core/node" (adds reverse DNS).
   */
  verifier?: (
    agent: DetectedAgent,
    ip: string,
  ) => VerificationStatus | Promise<VerificationStatus>;
}
