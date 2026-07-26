import { createServer, type Server } from "node:http";
import type { SqliteStore } from "@ai-crawler-tracker/sqlite";
import { eventsToCsv } from "./csv.js";
import { dashboardPage } from "./page.js";

export interface DashboardOptions {
  port?: number;
}

export function buildStats(store: SqliteStore, days: number) {
  const sinceIso = new Date(Date.now() - days * 86_400_000).toISOString();
  return {
    days,
    total: store.totalEvents(sinceIso),
    agents: store.countsByAgent(sinceIso),
    pages: store.countsByPage(sinceIso, 25),
    daily: store.dailyCounts(days),
    recent: store.recentEvents(25),
  };
}

export function createDashboardServer(store: SqliteStore, options: DashboardOptions = {}): Server {
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");

    if (url.pathname === "/api/stats") {
      const days = Math.max(1, Math.min(365, Number(url.searchParams.get("days")) || 30));
      res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      res.end(JSON.stringify(buildStats(store, days)));
      return;
    }

    if (url.pathname === "/export.csv") {
      const days = Math.max(1, Math.min(365, Number(url.searchParams.get("days")) || 30));
      const sep = url.searchParams.get("sep") === ";" ? ";" : ",";
      const sinceIso = new Date(Date.now() - days * 86_400_000).toISOString();
      res.writeHead(200, {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="ai-crawler-${days}d.csv"`,
      });
      res.end(eventsToCsv(store.eventsSince(sinceIso), sep));
      return;
    }

    if (url.pathname === "/") {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(dashboardPage());
      return;
    }

    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("No encontrado");
  });

  server.listen(options.port ?? 4321);
  return server;
}
