import { afterAll, describe, expect, it } from "vitest";
import { createSqliteStore } from "@ai-crawler-tracker/sqlite";
import { buildStats, createDashboardServer } from "./index.js";
import { seedDemoData } from "./demo.js";

const store = createSqliteStore({ path: ":memory:" });
seedDemoData(store, 10, 5);
const server = createDashboardServer(store, { port: 0 });

function baseUrl(): string {
  const addr = server.address();
  if (typeof addr === "object" && addr) return `http://127.0.0.1:${addr.port}`;
  throw new Error("server not listening");
}

afterAll(() => {
  server.close();
  store.close();
});

describe("dashboard", () => {
  it("buildStats aggregates seeded data", () => {
    const stats = buildStats(store, 30);
    expect(stats.total).toBeGreaterThan(0);
    expect(stats.agents.length).toBeGreaterThan(0);
    expect(stats.daily.length).toBeGreaterThan(0);
    expect(stats.agents[0].count).toBeGreaterThanOrEqual(stats.agents.at(-1)!.count);
  });

  it("serves the HTML panel in Spanish", async () => {
    const res = await fetch(baseUrl() + "/");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('lang="es"');
    expect(html).toContain("Visitas de agentes de IA");
  });

  it("serves JSON stats with a days filter", async () => {
    const res = await fetch(baseUrl() + "/api/stats?days=7");
    expect(res.status).toBe(200);
    const stats = await res.json();
    expect(stats.days).toBe(7);
    expect(stats.total).toBeGreaterThan(0);
  });

  it("exports CSV with UTF-8 BOM and Spanish headers", async () => {
    const res = await fetch(baseUrl() + "/export.csv?days=30");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/csv");
    const bytes = new Uint8Array(await res.arrayBuffer());
    // UTF-8 BOM (EF BB BF) — res.text() would strip it, so check raw bytes
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    const csv = new TextDecoder().decode(bytes.slice(3));
    const [header, firstRow] = csv.split("\r\n");
    expect(header).toBe("fecha,agente,operador,categoria,verificacion,pagina,metodo,host,referencia,ip,user_agent");
    expect(firstRow.split(",").length).toBeGreaterThanOrEqual(11);
  });

  it("supports semicolon separator for Spanish-locale Excel", async () => {
    const res = await fetch(baseUrl() + "/export.csv?days=30&sep=;");
    const csv = await res.text();
    expect(csv).toContain("fecha;agente;operador");
  });

  it("returns 404 for unknown routes", async () => {
    const res = await fetch(baseUrl() + "/nada");
    expect(res.status).toBe(404);
  });
});
