#!/usr/bin/env node
import { createSqliteStore } from "@ai-crawler-tracker/sqlite";
import { createDashboardServer } from "./index.js";
import { seedDemoData } from "./demo.js";

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const demo = process.argv.includes("--demo");
const dbPath = argValue("--db") ?? process.env.AI_CRAWLER_DB ?? (demo ? ":memory:" : "./ai-crawler.db");
const port = Number(argValue("--port") ?? process.env.AI_CRAWLER_PORT ?? 4321);

const store = createSqliteStore({ path: dbPath });
if (demo) seedDemoData(store);

createDashboardServer(store, { port });
console.log(`Panel de AI Crawler Tracker en http://localhost:${port}`);
console.log(`Base de datos: ${dbPath}${demo ? " (datos de demostración)" : ""}`);
