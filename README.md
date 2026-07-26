# ai-crawler-tracker

**Descubre qué inteligencias artificiales están leyendo tu web** — qué agentes (GPTBot de OpenAI, ClaudeBot de Anthropic, PerplexityBot...), qué páginas visitan y con qué frecuencia. Open source, autohospedable y en español.

> Instala una librería, abre el panel y mira qué IA consulta tu contenido. Tus datos nunca salen de tu máquina.

## ¿Qué problema resuelve?

Las empresas de IA rastrean la web constantemente: para entrenar sus modelos, para alimentar sus buscadores y para responder preguntas de sus usuarios en tiempo real. Si tienes una web, es casi seguro que ya te están visitando — pero **no aparecen en Google Analytics ni en ninguna herramienta tradicional**.

¿Por qué? Porque esas herramientas funcionan con JavaScript en el navegador, y los bots de IA descargan tu HTML **sin ejecutar JavaScript**. Son invisibles para ellas.

La única forma de verlos es detectarlos **en el servidor**, antes de que se genere la respuesta. Eso es exactamente lo que hace esta librería.

## Pruébalo en 30 segundos (sin instalar nada en tu web)

```sh
git clone https://github.com/AldaMartdev/ai-crawler-tracker
cd ai-crawler-tracker
pnpm install && pnpm build
node packages/dashboard/dist/cli.js --demo
```

Abre `http://localhost:4321` y verás el panel con datos de demostración: visitas por agente, tendencia diaria, páginas más consultadas y últimas visitas.

## Cómo funciona (en 3 pasos)

```
1. DETECTAR      El middleware mira el User-Agent de cada petición.
                 Si es un bot de IA conocido (~25 agentes), crea un evento.

2. GUARDAR       El evento se guarda en una base SQLite local
                 (o se envía a donde tú digas). Nunca retrasa la página.

3. VISUALIZAR    El panel local lee esa base y te muestra todo:
                 agentes, páginas, tendencias, verificación y exportación.
```

## Requisitos

- **Node.js 22.5 o superior** (usa el SQLite integrado de Node — sin dependencias nativas que compilar).
- Un sitio con servidor: Express, Next.js, Cloudflare Workers, Vercel o Netlify. *(Un sitio 100 % estático sin servidor no puede detectar bots — no hay código que se ejecute cuando llega la petición.)*

## Instalación según tu framework

En todos los casos el patrón es el mismo: creas un **almacén** y conectas el **tracker** con `onDetect`.

### Express

```ts
import express from "express";
import { aiCrawlerTracker } from "@ai-crawler-tracker/express";
import { createSqliteStore } from "@ai-crawler-tracker/sqlite";

const app = express();
const store = createSqliteStore({ path: "./ai-crawler.db" });

app.use(aiCrawlerTracker({ onDetect: store.onDetect }));
```

Eso es todo. Cada visita de un bot de IA queda registrada en `ai-crawler.db`.

### Next.js

```ts
// proxy.ts en la raíz del proyecto (middleware.ts si usas Next.js 15 o anterior)
import { createAITracker } from "@ai-crawler-tracker/next";

export const proxy = createAITracker({
  endpoint: process.env.AI_CRAWLER_ENDPOINT, // adónde enviar los eventos
});
```

¿Ya tienes un proxy/middleware? Combínalo sin conflicto:

```ts
import { NextResponse, type NextRequest, type NextFetchEvent } from "next/server";
import { trackAICrawler } from "@ai-crawler-tracker/next";

export function proxy(request: NextRequest, event: NextFetchEvent) {
  trackAICrawler(request, event, { endpoint: process.env.AI_CRAWLER_ENDPOINT });
  // ... tu lógica existente ...
  return NextResponse.next();
}
```

El envío usa `event.waitUntil`, así que ocurre **después** de responder al visitante: cero retraso añadido.

> **Nota:** el middleware de Next.js corre en runtime edge, donde no hay acceso a disco. Por eso ahí se usa `endpoint` (enviar los eventos a una URL, por ejemplo tu propia API que escriba en SQLite) en lugar de `onDetect` con SQLite directo. Si tu Next.js corre con runtime Node, puedes usar SQLite directamente.

### Cloudflare Workers

```ts
import { createCloudflareTracker } from "@ai-crawler-tracker/edge";

const track = createCloudflareTracker({ endpoint: "https://tu-api.com/eventos" });

export default {
  async fetch(request, env, ctx) {
    track(request, ctx); // usa ctx.waitUntil — no retrasa nada
    return tuManejador(request);
  },
};
```

### Vercel Edge Middleware

```ts
// middleware.ts
import { createVercelEdgeTracker } from "@ai-crawler-tracker/edge";

export default createVercelEdgeTracker({ endpoint: process.env.AI_CRAWLER_ENDPOINT });
```

### Netlify Edge Functions

```ts
// netlify/edge-functions/ai-tracker.ts
import { createNetlifyTracker } from "@ai-crawler-tracker/edge";

export default createNetlifyTracker({ endpoint: Netlify.env.get("AI_CRAWLER_ENDPOINT") });
```

```toml
# netlify.toml
[[edge_functions]]
function = "ai-tracker"
path = "/*"
```

## El panel

```sh
npx @ai-crawler-tracker/dashboard --db ./ai-crawler.db --port 4321
```

Abre `http://localhost:4321`:

- **Visitas de IA, agentes distintos, agente principal y página más consultada** de un vistazo.
- **Solicitudes por agente** y **visitas por día** en gráficos.
- **Páginas más consultadas**: qué contenido tuyo interesa a cada IA.
- **Últimas visitas** con su tipo y estado de verificación.
- Filtros de 7 / 30 / 90 días y modo oscuro automático.

Todo local: el panel lee tu archivo SQLite y no envía nada a ningún sitio.

## Verificación: ¿es realmente GPTBot?

Cualquiera puede poner `GPTBot` en su User-Agent y hacerse pasar por OpenAI (pasa constantemente: scrapers que se disfrazan de bots "legítimos"). Esta librería puede comprobar si la IP de cada visita **pertenece de verdad al operador declarado**:

```ts
// En Node (Express, Next.js con runtime Node) — la verificación más completa:
import { createNodeVerifier } from "@ai-crawler-tracker/core/node";

app.use(aiCrawlerTracker({
  onDetect: store.onDetect,
  verifier: createNodeVerifier(),
}));
```

```ts
// En edge (Cloudflare, Vercel, Netlify) — sin DNS, solo rangos IP publicados:
import { createIpRangeVerifier } from "@ai-crawler-tracker/core";

const track = createCloudflareTracker({ verifier: createIpRangeVerifier(), /* ... */ });
```

Cada evento queda marcado como:

| Estado | Significado |
|---|---|
| `verified` | La IP pertenece al operador (según sus rangos publicados o su DNS inverso confirmado). |
| `spoofed` | La comprobación se hizo y la IP **no** es del operador: alguien se está haciendo pasar por ese bot. |
| `unverified` | No hay datos públicos para verificar ese agente, o la comprobación no pudo completarse. |

Cómo se comprueba: OpenAI y Perplexity publican sus rangos de IP oficiales (se descargan y cachean 24 h); Google, Apple, Amazon, ByteDance, Huawei y DuckDuckGo se verifican por DNS inverso con confirmación directa. La verificación corre en segundo plano y nunca retrasa la respuesta.

## Exportar a CSV, Excel y Power BI

Desde el panel con el botón **"Exportar CSV"**, o directamente por URL:

```
http://localhost:4321/export.csv?days=90        → separador coma (Power BI, Excel en inglés)
http://localhost:4321/export.csv?days=90&sep=;  → separador punto y coma (Excel en español)
```

El archivo incluye BOM UTF-8 (los acentos se ven bien en Excel) y columnas en español: fecha, agente, operador, categoría, verificación, página, método, host, referencia, IP y user_agent. En Power BI puedes usar la URL directamente como origen de datos web.

## ¿Qué agentes detecta?

Unos 25, clasificados en tres categorías:

| Categoría | Qué hace | Ejemplos |
|---|---|---|
| `training` | Recopila contenido para **entrenar** modelos | GPTBot, ClaudeBot, Meta-ExternalAgent, Bytespider, CCBot, Amazonbot |
| `search` | Indexa para **buscadores con IA** | OAI-SearchBot, Claude-SearchBot, PerplexityBot, Applebot, PetalBot |
| `assistant` | Consulta una página **en vivo** porque un usuario se lo pidió al chatbot | ChatGPT-User, Claude-User, Perplexity-User, DuckAssistBot, MistralAI-User |

La distinción importa: `training` significa "tu contenido alimenta el próximo modelo"; `assistant` significa "un humano está leyendo tu página a través de una IA ahora mismo".

Lista completa en [agents.ts](packages/core/src/agents.ts). ¿Falta uno? Añádelo sin esperar una actualización:

```ts
aiCrawlerTracker({
  extraAgents: [{ slug: "mibot", name: "MiBot", operator: "Acme", category: "search", pattern: "mibot" }],
});
```

## Paquetes

| Paquete | Para qué |
|---|---|
| [`@ai-crawler-tracker/core`](packages/core/) | Detección, clasificación, verificación y envío. Sin dependencias. Los demás lo usan por dentro. |
| [`@ai-crawler-tracker/express`](packages/express/) | Middleware para Express. |
| [`@ai-crawler-tracker/next`](packages/next/) | Proxy/middleware para Next.js. |
| [`@ai-crawler-tracker/edge`](packages/edge/) | Cloudflare Workers, Vercel Edge, Netlify Edge Functions. |
| [`@ai-crawler-tracker/sqlite`](packages/sqlite/) | Almacenamiento local con el SQLite integrado de Node. |
| [`@ai-crawler-tracker/dashboard`](packages/dashboard/) | Panel web local + exportación CSV. |

## Opciones comunes (todos los adaptadores)

```ts
{
  onDetect: (event) => { ... },  // recibe cada evento — guárdalo donde quieras
  endpoint: "https://...",       // o envíalo como JSON por POST a esta URL
  apiKey: "...",                 // se añade como cabecera Authorization: Bearer
  verifier: createNodeVerifier(),// verificación de IP (opcional)
  ignorePaths: ["/admin"],       // prefijos de ruta a ignorar
  extraAgents: [...],            // agentes adicionales a detectar
}
```

Cada evento tiene esta forma:

```ts
{
  agent: { slug: "gptbot", name: "GPTBot", operator: "OpenAI", category: "training", userAgent: "..." },
  path: "/blog/mi-articulo",
  method: "GET",
  timestamp: "2026-07-25T18:30:00.000Z",
  host: "mi-sitio.com",
  ip: "132.196.86.4",
  verification: "verified"   // solo si configuraste un verifier
}
```

## Preguntas frecuentes

**¿Ralentiza mi web?** No. La detección es una comparación de strings (microsegundos) y el guardado/envío ocurre en segundo plano, después de responder al visitante.

**¿Y si la librería falla?** Nunca rompe tu aplicación: todos los errores internos se capturan y la petición sigue su curso normal.

**¿Esto bloquea a los bots?** No — esta herramienta **mide**, no bloquea. Para bloquear usa `robots.txt` o las reglas de tu servidor/CDN. Pero primero conviene medir: quizá descubras que el tráfico de IA te trae lectores.

**¿Necesito una cuenta o un servicio externo?** No. Todo funciona en tu máquina con `onDetect` + SQLite. El `endpoint` existe por si prefieres centralizar eventos de varios sitios.

**¿Detecta el tráfico humano que llega desde ChatGPT o Perplexity?** Detecta las visitas de tipo `assistant` (la IA leyendo tu página en nombre de un usuario). El tráfico de humanos que hacen clic en un enlace citado por una IA llega con `Referer` normal y se ve en tu analítica tradicional.

## Desarrollo

```sh
pnpm install    # instalar dependencias
pnpm build      # compilar los 6 paquetes
pnpm test       # 34 tests con vitest
pnpm typecheck  # comprobación de tipos
```

Estructura: monorepo pnpm; cada paquete en `packages/` con su `src/`, tests junto al código y build con tsup.

## Licencia

Apache-2.0
