# Contribuir a ai-crawler-tracker

¡Gracias por tu interés! Contribuciones de cualquier tamaño son bienvenidas: reportar un bug, añadir un agente de IA nuevo, mejorar la documentación o proponer una funcionalidad.

## Levantar el proyecto

Requisitos: Node.js ≥ 22.5 y pnpm (o `corepack enable`).

```sh
git clone https://github.com/AldaMartdev/ai-crawler-tracker
cd ai-crawler-tracker
pnpm install
pnpm build       # compila los 6 paquetes
pnpm test        # tests con vitest
pnpm typecheck   # comprobación de tipos
```

Para ver el panel con datos de demostración:

```sh
node packages/dashboard/dist/cli.js --demo
# abre http://localhost:4321
```

## Estructura

Monorepo pnpm. Cada paquete vive en `packages/` con su código en `src/`, los tests junto al código (`*.test.ts`) y build con tsup:

| Paquete | Qué contiene |
|---|---|
| `core` | Detección, clasificación, verificación IP/DNS, envío de eventos |
| `express` / `next` / `edge` | Adaptadores por framework (wrappers finos sobre core) |
| `sqlite` | Almacenamiento local con `node:sqlite` |
| `dashboard` | Panel web local + exportación CSV |

## Añadir un agente de IA nuevo

Es la contribución más útil y la más sencilla:

1. Añade su firma en [packages/core/src/agents.ts](packages/core/src/agents.ts) (slug, nombre, operador, categoría `training`/`search`/`assistant` y el patrón de su User-Agent).
2. Si el operador publica rangos IP o usa reverse DNS verificable, añade la fuente en [packages/core/src/verify.ts](packages/core/src/verify.ts).
3. Añade un caso en `detect.test.ts` con un User-Agent real del bot.

## Pull requests

- Una funcionalidad o arreglo por PR.
- `pnpm build && pnpm typecheck && pnpm test` deben pasar.
- Si cambias comportamiento, acompáñalo de un test.

## Publicación (mantenedores)

Los paquetes se publican en npm bajo el scope `@ai-crawler-tracker` mediante GitHub Actions con [Trusted Publishing](https://docs.npmjs.com/trusted-publishers) (OIDC, sin tokens):

1. Sube las versiones en los `package.json` afectados.
2. Crea y empuja un tag `vX.Y.Z` — el workflow [publish.yml](.github/workflows/publish.yml) compila, testea y publica.

Nota: la **primera** publicación de cada paquete puede requerir un `npm publish --access public` manual (con 2FA) antes de poder configurar el Trusted Publisher en npmjs.com (Package → Settings → Trusted Publisher → GitHub Actions, indicando `AldaMartdev/ai-crawler-tracker` y `publish.yml`).
