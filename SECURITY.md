# Política de seguridad

## Versiones con soporte

Solo la última versión publicada de cada paquete recibe correcciones de seguridad.

## Reportar una vulnerabilidad

**No abras un issue público.** Usa una de estas vías:

- [GitHub Security Advisories](https://github.com/AldaMartdev/ai-crawler-tracker/security/advisories/new) (preferida): permite coordinar la corrección en privado.
- Email: bmartinezhuamani@gmail.com con el asunto `[SECURITY] ai-crawler-tracker`.

Incluye si puedes: paquete y versión afectados, pasos para reproducir y el impacto que estimas.

Respuesta inicial en un plazo de 7 días. Si se confirma, la corrección se publica como versión de parche y se te acreditará en las notas (salvo que prefieras anonimato).

## Consideraciones de diseño

- La librería nunca ejecuta contenido de las peticiones: solo lee cabeceras (`User-Agent`, `Referer`, IP) y las registra.
- Los errores internos se capturan siempre — un fallo del tracker no puede tumbar la aplicación anfitriona.
- El almacenamiento SQLite y el panel son locales; ningún dato sale de tu infraestructura salvo que configures `endpoint` explícitamente.
- El panel local no tiene autenticación: está pensado para `localhost`. No lo expongas a internet sin ponerle un proxy con autenticación delante.
