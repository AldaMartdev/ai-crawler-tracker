export function dashboardPage(): string {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>AI Crawler Tracker — Panel</title>
<style>
  :root {
    color-scheme: light;
    --page:           #f9f9f7;
    --surface-1:      #fcfcfb;
    --text-primary:   #0b0b0b;
    --text-secondary: #52514e;
    --text-muted:     #898781;
    --gridline:       #e1e0d9;
    --baseline:       #c3c2b7;
    --border:         rgba(11,11,11,0.10);
    --accent:         #2a78d6;
    --accent-soft:    rgba(42,120,214,0.14);
    --cat-training:   #2a78d6;
    --cat-search:     #eb6834;
    --cat-assistant:  #1baf7a;
    --status-good:    #006300;
    --status-critical:#d03b3b;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      color-scheme: dark;
      --page:           #0d0d0d;
      --surface-1:      #1a1a19;
      --text-primary:   #ffffff;
      --text-secondary: #c3c2b7;
      --text-muted:     #898781;
      --gridline:       #2c2c2a;
      --baseline:       #383835;
      --border:         rgba(255,255,255,0.10);
      --accent:         #3987e5;
      --accent-soft:    rgba(57,135,229,0.20);
      --cat-training:   #3987e5;
      --cat-search:     #d95926;
      --cat-assistant:  #199e70;
      --status-good:    #0ca30c;
      --status-critical:#d03b3b;
    }
  }
  * { box-sizing: border-box; margin: 0; }
  body {
    background: var(--page);
    color: var(--text-primary);
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
    font-size: 14px;
    padding: 24px;
    max-width: 1080px;
    margin: 0 auto;
  }
  header { display: flex; align-items: baseline; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; }
  h1 { font-size: 20px; font-weight: 650; }
  h1 small { font-weight: 400; color: var(--text-muted); font-size: 13px; margin-left: 8px; }
  h2 { font-size: 14px; font-weight: 600; color: var(--text-secondary); margin-bottom: 12px; }
  .filters { display: flex; gap: 4px; }
  .filters button {
    font: inherit; color: var(--text-secondary);
    background: none; border: 1px solid transparent; border-radius: 6px;
    padding: 5px 12px; cursor: pointer;
  }
  .filters button:hover { background: var(--accent-soft); }
  .filters button[aria-pressed="true"] { color: var(--text-primary); font-weight: 600; border-color: var(--border); background: var(--surface-1); }
  .filters a {
    color: var(--accent); text-decoration: none; font-size: 13px;
    padding: 5px 12px; border: 1px solid var(--border); border-radius: 6px; margin-left: 8px;
  }
  .filters a:hover { background: var(--accent-soft); }
  .verif { font-size: 12px; white-space: nowrap; }
  .verif.ok { color: var(--status-good); }
  .verif.bad { color: var(--status-critical); font-weight: 600; }
  .verif.none { color: var(--text-muted); }
  .card { background: var(--surface-1); border: 1px solid var(--border); border-radius: 10px; padding: 16px 18px; }
  .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 16px; }
  .kpi .label { color: var(--text-muted); font-size: 12px; margin-bottom: 6px; }
  .kpi .value { font-size: 30px; font-weight: 650; line-height: 1.1; }
  .kpi .sub { color: var(--text-secondary); font-size: 12px; margin-top: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
  @media (max-width: 800px) { .grid2 { grid-template-columns: 1fr; } }
  .bars { display: grid; grid-template-columns: max-content 1fr max-content; gap: 6px 10px; align-items: center; }
  .bars .name { font-size: 13px; }
  .bars .name .dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; }
  .bars .track { height: 14px; position: relative; }
  .bars .fill {
    position: absolute; inset: 0 auto 0 0; min-width: 2px;
    background: var(--accent); border-radius: 0 4px 4px 0;
  }
  .bars .track:hover .fill { filter: brightness(1.15); }
  .bars .num { font-variant-numeric: tabular-nums; color: var(--text-secondary); font-size: 12px; }
  svg text { font-family: inherit; font-size: 11px; fill: var(--text-muted); font-variant-numeric: tabular-nums; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 12px; font-weight: 600; color: var(--text-muted); padding: 6px 8px; border-bottom: 1px solid var(--baseline); }
  td { padding: 6px 8px; border-bottom: 1px solid var(--gridline); font-size: 13px; }
  td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
  tr:last-child td { border-bottom: none; }
  .chip { font-size: 11px; color: var(--text-secondary); white-space: nowrap; }
  .chip .dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; margin-right: 4px; }
  .empty { color: var(--text-muted); text-align: center; padding: 40px 16px; }
  .empty code { background: var(--accent-soft); padding: 2px 6px; border-radius: 4px; font-size: 12px; }
  #tooltip {
    position: fixed; pointer-events: none; z-index: 10; display: none;
    background: var(--surface-1); border: 1px solid var(--border); border-radius: 6px;
    padding: 6px 10px; font-size: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.12);
  }
  #tooltip .t-title { font-weight: 600; color: var(--text-primary); }
  #tooltip .t-body { color: var(--text-secondary); font-variant-numeric: tabular-nums; }
  footer { color: var(--text-muted); font-size: 12px; margin-top: 20px; text-align: center; }
</style>
</head>
<body>
<header>
  <h1>Visitas de agentes de IA <small id="range-label"></small></h1>
  <nav class="filters" aria-label="Rango de fechas">
    <button data-days="7">7 días</button>
    <button data-days="30" aria-pressed="true">30 días</button>
    <button data-days="90">90 días</button>
    <a id="export-link" href="/export.csv?days=30" download>Exportar CSV</a>
  </nav>
</header>

<div id="content"><p class="empty">Cargando…</p></div>
<div id="tooltip" role="tooltip"></div>
<footer>ai-crawler-tracker — panel local, tus datos no salen de esta máquina.</footer>

<script>
const CAT = {
  training:  { label: "Entrenamiento", color: "var(--cat-training)" },
  search:    { label: "Búsqueda",      color: "var(--cat-search)" },
  assistant: { label: "Asistente",     color: "var(--cat-assistant)" },
};
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
const fmt = (n) => n.toLocaleString("es");
let days = 30;

const tooltip = document.getElementById("tooltip");
function showTip(x, y, title, body) {
  tooltip.innerHTML = '<div class="t-title">' + esc(title) + '</div><div class="t-body">' + esc(body) + "</div>";
  tooltip.style.display = "block";
  const w = tooltip.offsetWidth;
  tooltip.style.left = Math.min(x + 12, window.innerWidth - w - 8) + "px";
  tooltip.style.top = (y + 14) + "px";
}
function hideTip() { tooltip.style.display = "none"; }

function chip(category) {
  const c = CAT[category] || { label: category, color: "var(--text-muted)" };
  return '<span class="chip"><span class="dot" style="background:' + c.color + '"></span>' + esc(c.label) + "</span>";
}

function kpis(s) {
  const top = s.agents[0];
  const topPage = s.pages[0];
  return '<div class="kpis">' +
    '<div class="card kpi"><div class="label">Visitas de IA</div><div class="value">' + fmt(s.total) + "</div></div>" +
    '<div class="card kpi"><div class="label">Agentes distintos</div><div class="value">' + fmt(s.agents.length) + "</div></div>" +
    '<div class="card kpi"><div class="label">Agente principal</div><div class="value" style="font-size:20px">' + (top ? esc(top.name) : "—") + '</div><div class="sub">' + (top ? fmt(top.count) + " visitas · " + esc(top.operator) : "") + "</div></div>" +
    '<div class="card kpi"><div class="label">Página más consultada</div><div class="value" style="font-size:20px">' + (topPage ? esc(topPage.path) : "—") + '</div><div class="sub">' + (topPage ? fmt(topPage.count) + " visitas de " + esc(topPage.agentName) : "") + "</div></div>" +
  "</div>";
}

function agentBars(agents) {
  const max = Math.max(...agents.map((a) => a.count), 1);
  const rows = agents.map((a) =>
    '<div class="name"><span class="dot" style="background:' + (CAT[a.category]?.color || "var(--text-muted)") + '"></span>' + esc(a.name) + "</div>" +
    '<div class="track" data-tip-title="' + esc(a.name) + '" data-tip-body="' + esc(fmt(a.count) + " visitas · " + a.operator + " · " + (CAT[a.category]?.label || a.category)) + '">' +
      '<div class="fill" style="width:' + (100 * a.count / max).toFixed(1) + '%"></div></div>' +
    '<div class="num">' + fmt(a.count) + "</div>",
  ).join("");
  return '<div class="card"><h2>Solicitudes por agente</h2><div class="bars">' + rows + "</div></div>";
}

function trendChart(daily) {
  const W = 480, H = 180, P = { t: 12, r: 12, b: 22, l: 36 };
  const iw = W - P.l - P.r, ih = H - P.t - P.b;
  const max = Math.max(...daily.map((d) => d.count), 1);
  const x = (i) => P.l + (daily.length > 1 ? (i * iw) / (daily.length - 1) : iw / 2);
  const y = (v) => P.t + ih - (v / max) * ih;
  const pts = daily.map((d, i) => x(i).toFixed(1) + "," + y(d.count).toFixed(1)).join(" ");
  const ticks = [0, Math.round(max / 2), max];
  const gridlines = ticks.map((t) =>
    '<line x1="' + P.l + '" x2="' + (W - P.r) + '" y1="' + y(t) + '" y2="' + y(t) + '" stroke="var(--gridline)" stroke-width="1"/>' +
    '<text x="' + (P.l - 6) + '" y="' + (y(t) + 3) + '" text-anchor="end">' + fmt(t) + "</text>",
  ).join("");
  const first = daily[0], last = daily[daily.length - 1];
  const labels =
    '<text x="' + P.l + '" y="' + (H - 6) + '">' + esc(first ? first.day.slice(5) : "") + "</text>" +
    '<text x="' + (W - P.r) + '" y="' + (H - 6) + '" text-anchor="end">' + esc(last && last !== first ? last.day.slice(5) : "") + "</text>";
  const area = daily.length > 1
    ? '<polygon points="' + P.l + "," + y(0).toFixed(1) + " " + pts + " " + (W - P.r) + "," + y(0).toFixed(1) + '" fill="var(--accent-soft)"/>'
    : "";
  const dots = daily.map((d, i) =>
    '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(d.count).toFixed(1) + '" r="8" fill="transparent" ' +
    'data-tip-title="' + esc(d.day) + '" data-tip-body="' + esc(fmt(d.count) + " visitas") + '"/>',
  ).join("");
  return '<div class="card"><h2>Visitas por día</h2>' +
    '<svg viewBox="0 0 ' + W + " " + H + '" style="width:100%;height:auto" role="img" aria-label="Visitas de IA por día">' +
    gridlines + area +
    '<polyline points="' + pts + '" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>' +
    '<line x1="' + P.l + '" x2="' + (W - P.r) + '" y1="' + y(0) + '" y2="' + y(0) + '" stroke="var(--baseline)" stroke-width="1"/>' +
    labels + dots + "</svg></div>";
}

function pagesTable(pages) {
  const rows = pages.map((p) =>
    "<tr><td>" + esc(p.path) + "</td><td>" + esc(p.agentName) + '</td><td class="num">' + fmt(p.count) + "</td></tr>",
  ).join("");
  return '<div class="card"><h2>Páginas más consultadas</h2><table><thead><tr><th>Página</th><th>Agente</th><th class="num">Visitas</th></tr></thead><tbody>' + rows + "</tbody></table></div>";
}

function verifBadge(v) {
  if (v === "verified") return '<span class="verif ok" title="La IP pertenece al operador declarado">✓ verificado</span>';
  if (v === "spoofed") return '<span class="verif bad" title="La IP NO pertenece al operador declarado">✗ sospechoso</span>';
  return '<span class="verif none" title="Sin datos para verificar este agente">—</span>';
}

function recentTable(recent) {
  const rows = recent.map((e) =>
    "<tr><td>" + esc(e.timestamp.slice(0, 16).replace("T", " ")) + "</td><td>" + esc(e.agentName) + "</td><td>" + chip(e.category) + "</td><td>" + esc(e.path) + "</td><td>" + verifBadge(e.verification) + "</td></tr>",
  ).join("");
  return '<div class="card"><h2>Últimas visitas</h2><table><thead><tr><th>Fecha (UTC)</th><th>Agente</th><th>Tipo</th><th>Página</th><th>Verif.</th></tr></thead><tbody>' + rows + "</tbody></table></div>";
}

async function load() {
  const res = await fetch("/api/stats?days=" + days);
  const s = await res.json();
  document.getElementById("range-label").textContent = "últimos " + s.days + " días";
  document.getElementById("export-link").href = "/export.csv?days=" + s.days;
  const content = document.getElementById("content");
  if (s.total === 0) {
    content.innerHTML = '<div class="card empty"><p>Aún no hay visitas de agentes de IA registradas en este periodo.</p>' +
      "<p style=\\"margin-top:8px\\">Conecta el tracker con <code>onDetect: store.onDetect</code> y espera la primera visita.</p></div>";
    return;
  }
  content.innerHTML = kpis(s) +
    '<div class="grid2">' + agentBars(s.agents) + trendChart(s.daily) + "</div>" +
    '<div class="grid2">' + pagesTable(s.pages) + recentTable(s.recent) + "</div>";
}

document.querySelector(".filters").addEventListener("click", (ev) => {
  const btn = ev.target.closest("button[data-days]");
  if (!btn) return;
  days = Number(btn.dataset.days);
  document.querySelectorAll(".filters button").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
  load();
});
document.body.addEventListener("mousemove", (ev) => {
  const el = ev.target.closest("[data-tip-title]");
  if (el) showTip(ev.clientX, ev.clientY, el.dataset.tipTitle, el.dataset.tipBody);
  else hideTip();
});

load();
setInterval(load, 30_000);
</script>
</body>
</html>`;
}
