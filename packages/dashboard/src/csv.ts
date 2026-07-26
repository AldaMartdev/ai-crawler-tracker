import type { StoredEvent } from "@ai-crawler-tracker/sqlite";

const HEADERS = [
  "fecha",
  "agente",
  "operador",
  "categoria",
  "verificacion",
  "pagina",
  "metodo",
  "host",
  "referencia",
  "ip",
  "user_agent",
];

function cell(value: string | null | undefined, sep: string): string {
  const s = value ?? "";
  return s.includes(sep) || s.includes('"') || s.includes("\n") ? '"' + s.replaceAll('"', '""') + '"' : s;
}

/** CSV with BOM so Excel and Power BI detect UTF-8. */
export function eventsToCsv(events: StoredEvent[], sep = ","): string {
  const rows = events.map((e) =>
    [
      e.timestamp,
      e.agentName,
      e.operator,
      e.category,
      e.verification ?? "",
      e.path,
      e.method,
      e.host ?? "",
      e.referer ?? "",
      e.ip ?? "",
      e.userAgent,
    ]
      .map((v) => cell(v, sep))
      .join(sep),
  );
  return "﻿" + [HEADERS.join(sep), ...rows].join("\r\n") + "\r\n";
}
