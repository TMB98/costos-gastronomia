# CLAUDE.md

Instrucciones operativas para trabajar en este repo con Claude Code. Conciso a propósito — el detalle vive en otros documentos, linkeados abajo.

## Qué es

App de gestión de costos/precios para un negocio gastronómico real ("La Nuna"). React + Vite + Tailwind, sin backend propio — Supabase (Postgres + Auth + RLS + RPC) como única persistencia.

## Arquitectura en una línea

`UI (features/*) → App.jsx (estado + handlers) → services/datos.js → Supabase`
Detalle completo, tabla "¿Dónde toco esto?" y convenciones de código: **ARCHITECTURE.md**.

## Dónde está cada cosa

- Lógica de negocio pura (cálculos): `src/lib/calculos.js` — nunca dentro de un componente.
- Única puerta a Supabase: `src/services/datos.js` (datos) y `src/services/supabase.js` (auth). Ningún componente debería importar `@supabase/supabase-js` directo.
- Permisos por rol: `src/auth/usuarios.js`.
- Tests: `tests/`, espejando `src/` 1 a 1 — antes de tocar un módulo, fijate si ya tiene test.

## Comandos

- `npm run validate` — tests + build. Correr SIEMPRE antes de dar un cambio por terminado.
- `npm test` — solo tests. `npm run build` — solo build. `npm run dev` — servidor local.

## Reglas del proyecto (no negociables)

- Nunca hardcodear credenciales — todo vía `import.meta.env`, secretos solo en GitHub Actions.
- Nunca `.select("*, tabla(campo)")` de Supabase sin confirmar que existe FK directa entre esas tablas exactas (ya rompió producción 2 veces).
- Toda escritura nueva pasa por `services/datos.js`. Operación que toca >1 fila a la vez → función RPC en `supabase/migrations/`, nunca un loop de llamadas sueltas desde el cliente.
- Feature visible para el usuario → sumar entrada en `src/shell/novedadesContenido.js` + subir `APP_VERSION` en `src/config/constants.js` (mismo número que `version` en `package.json`).
- Antes de migrar esquema/datos: avisar que hace falta un backup manual y pausar el uso de la app mientras corre.

## Archivos que no se tocan sin necesidad real

- `supabase/migrations/*.sql` ya aplicadas — nunca editar una migración vieja, solo agregar una nueva.
- `.github/workflows/*.yml` — el pipeline ya funciona (ver DEVELOPMENT_WORKFLOW.md); cambiarlo es una acción sensible, confirmar antes de tocarlo.
- `config/constants.js` (colores/tokens de marca) — en stand-by, decisión de negocio pendiente del dueño del producto.

## Seguridad — reglas duras

- Nunca commitear `.env` ni mostrar valores reales de secrets en el chat.
- La service-role key de Supabase NUNCA va al frontend ni a un commit — solo la `anon key` (pública por diseño, ya acotada por RLS).
- Nunca merge a `main`, deploy a producción, ni cambio destructivo sobre datos reales sin confirmación explícita del usuario en esa conversación puntual.

## Cómo leer contexto (para no gastar de más)

1. Empezar por este archivo.
2. Identificar el módulo afectado con la tabla "¿Dónde toco esto?" de `ARCHITECTURE.md`.
3. Leer solo esos archivos + sus dependencias directas (el modal, su sección, su test, la función de `datos.js` que usa).
4. Ir a `PROJECT_CONTEXT.md` solo si hace falta entender una decisión de negocio o el estado del roadmap.
5. No releer el repo completo por default.

## Otros documentos

- **PROJECT_CONTEXT.md** — estado real, decisiones, roadmap, pendientes.
- **ARCHITECTURE.md** — mapa de código, convenciones, "¿dónde toco esto?".
- **DEVELOPMENT_WORKFLOW.md** — cómo se trabaja con Git/GitHub en este repo (branches, commits, PRs).
- **RUNBOOK.md** — qué hacer ante un incidente en producción.
