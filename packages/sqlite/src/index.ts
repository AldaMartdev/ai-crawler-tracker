import { DatabaseSync } from "node:sqlite";
import type { CrawlEvent } from "@ai-crawler-tracker/core";

export interface SqliteStoreOptions {
  /** File path for the database, or ":memory:". Default: "./ai-crawler.db" */
  path?: string;
}

export interface AgentCount {
  slug: string;
  name: string;
  operator: string;
  category: string;
  count: number;
}

export interface PageCount {
  path: string;
  agentName: string;
  count: number;
}

export interface StoredEvent {
  id: number;
  timestamp: string;
  agentSlug: string;
  agentName: string;
  operator: string;
  category: string;
  path: string;
  method: string;
  host: string | null;
  referer: string | null;
  userAgent: string;
  ip: string | null;
  verification: string | null;
}

export interface SqliteStore {
  /** Pass this as the tracker's onDetect option */
  onDetect: (event: CrawlEvent) => void;
  insert(event: CrawlEvent): void;
  countsByAgent(sinceIso?: string): AgentCount[];
  countsByPage(sinceIso?: string, limit?: number): PageCount[];
  recentEvents(limit?: number): StoredEvent[];
  /** All events since a date, oldest first — for exports */
  eventsSince(sinceIso?: string, limit?: number): StoredEvent[];
  totalEvents(sinceIso?: string): number;
  /** Events per day for the last `days` days, for trend charts */
  dailyCounts(days?: number): { day: string; count: number }[];
  close(): void;
}

export function createSqliteStore(options: SqliteStoreOptions = {}): SqliteStore {
  const db = new DatabaseSync(options.path ?? "./ai-crawler.db");
  db.exec(`
    CREATE TABLE IF NOT EXISTS crawl_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      agent_slug TEXT NOT NULL,
      agent_name TEXT NOT NULL,
      operator TEXT NOT NULL,
      category TEXT NOT NULL,
      path TEXT NOT NULL,
      method TEXT NOT NULL,
      host TEXT,
      referer TEXT,
      user_agent TEXT NOT NULL,
      ip TEXT,
      verification TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_events_timestamp ON crawl_events(timestamp);
    CREATE INDEX IF NOT EXISTS idx_events_agent ON crawl_events(agent_slug);
  `);

  // Databases created before v0.2 lack the ip/verification columns
  const columns = (db.prepare(`PRAGMA table_info(crawl_events)`).all() as { name: string }[]).map(
    (c) => c.name,
  );
  if (!columns.includes("ip")) db.exec(`ALTER TABLE crawl_events ADD COLUMN ip TEXT`);
  if (!columns.includes("verification")) db.exec(`ALTER TABLE crawl_events ADD COLUMN verification TEXT`);

  const insertStmt = db.prepare(`
    INSERT INTO crawl_events
      (timestamp, agent_slug, agent_name, operator, category, path, method, host, referer, user_agent, ip, verification)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  function insert(event: CrawlEvent): void {
    insertStmt.run(
      event.timestamp,
      event.agent.slug,
      event.agent.name,
      event.agent.operator,
      event.agent.category,
      event.path,
      event.method,
      event.host ?? null,
      event.referer ?? null,
      event.agent.userAgent,
      event.ip ?? null,
      event.verification ?? null,
    );
  }

  return {
    insert,
    onDetect: insert,

    countsByAgent(sinceIso = "") {
      return db
        .prepare(
          `SELECT agent_slug AS slug, agent_name AS name, operator, category, COUNT(*) AS count
           FROM crawl_events WHERE timestamp >= ?
           GROUP BY agent_slug ORDER BY count DESC`,
        )
        .all(sinceIso) as unknown as AgentCount[];
    },

    countsByPage(sinceIso = "", limit = 50) {
      return db
        .prepare(
          `SELECT path, agent_name AS agentName, COUNT(*) AS count
           FROM crawl_events WHERE timestamp >= ?
           GROUP BY path, agent_slug ORDER BY count DESC LIMIT ?`,
        )
        .all(sinceIso, limit) as unknown as PageCount[];
    },

    recentEvents(limit = 100) {
      return db
        .prepare(
          `SELECT id, timestamp, agent_slug AS agentSlug, agent_name AS agentName, operator,
                  category, path, method, host, referer, user_agent AS userAgent, ip, verification
           FROM crawl_events ORDER BY timestamp DESC, id DESC LIMIT ?`,
        )
        .all(limit) as unknown as StoredEvent[];
    },

    eventsSince(sinceIso = "", limit = 100_000) {
      return db
        .prepare(
          `SELECT id, timestamp, agent_slug AS agentSlug, agent_name AS agentName, operator,
                  category, path, method, host, referer, user_agent AS userAgent, ip, verification
           FROM crawl_events WHERE timestamp >= ? ORDER BY timestamp ASC, id ASC LIMIT ?`,
        )
        .all(sinceIso, limit) as unknown as StoredEvent[];
    },

    totalEvents(sinceIso = "") {
      const row = db
        .prepare(`SELECT COUNT(*) AS count FROM crawl_events WHERE timestamp >= ?`)
        .get(sinceIso) as { count: number };
      return row.count;
    },

    dailyCounts(days = 30) {
      const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
      return db
        .prepare(
          `SELECT substr(timestamp, 1, 10) AS day, COUNT(*) AS count
           FROM crawl_events WHERE timestamp >= ?
           GROUP BY day ORDER BY day`,
        )
        .all(since) as unknown as { day: string; count: number }[];
    },

    close() {
      db.close();
    },
  };
}
