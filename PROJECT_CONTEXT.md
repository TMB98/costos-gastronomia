# PROJECT_CONTEXT.md — La Nuna (gestión gastronómica)

> Handoff para continuar el desarrollo en una conversación nueva. Refleja el estado real verificado contra el código en GitHub al 19/09/2026. Ante cualquier contradicción con documentación vieja, este archivo manda.
>
> ⚠️ **Nota de esta revisión:** la versión anterior de este archivo decía "265/265 tests, build limpio" y daba por terminada la cobertura de `services/datos.js` (21 funciones) y de `App.jsx` (18 tests propios). Al bajar el repo real de GitHub y correr `npm test`, eso no estaba — la suite tenía 185 tests (16 fallando) y ningún test de `datos.js` ni de `App.jsx` existía. Esas mejoras se armaron en una sesión de chat anterior pero **nunca se subieron a GitHub** (no hubo commit/push). Este archivo ahora refleja solo lo que está confirmado en el repo real.

## 1. Objetivo de la aplicación

App de gestión para un negocio gastronómico real (cliente: Juani, dueño de "La Nuna"). Cubre: carga de materias primas y sus precios, armado de recetas/platos con cálculo de costo y margen, costos fijos, pricing (precio sugerido según margen objetivo), registro de ventas por pedido, y reportería (rentabilidad, benchmarks de mercado, ranking 80/20). Multiusuario, con roles.

## 2. Stack tecnológico

- **Frontend:** React 18 + Vite 5, Tailwind CSS 3
- **Backend:** Supabase (Postgres + Auth + RLS + funciones RPC) — sin backend propio
- **Testing:** Vitest + jsdom + react-dom (montaje real de componentes, sin `@testing-library`)
- **Deploy:** GitHub Actions → GitHub Pages. Repo: `tmb98/costos-gastronomia`
- **Cliente Supabase:** `@supabase/supabase-js` v2

## 3. Arquitectura actual

Migrado desde un monolito HTML de un solo archivo a un proyecto Vite modular. Capas:

```
UI (features/*) → App.jsx (orquestador) → services/datos.js → Supabase (RLS + RPC)
```

- **Cada acción de escritura pega a su tabla específica** (no hay más un JSON único que se reescribe entero). Esto fue el cambio de fondo de la "Etapa 3" — resolvió el riesgo de que dos usuarios trabajando a la vez se pisaran datos.
- Las operaciones que tocan varias filas a la vez (registrar un pedido con N ítems, borrar un pedido, actualización masiva de precios) usan **funciones RPC de Postgres** (transaccionales, todo-o-nada), no múltiples llamadas sueltas desde el cliente.

## 4. Estructura del repositorio

```
src/
├── App.jsx                 Orquestador: estado global, todos los handlers de negocio
├── AppConLogin.jsx          Maneja sesión + membresía (empresa/rol), envuelve <App>
├── main.jsx
├── config/constants.js      Colores, unidades, categorías default, APP_VERSION
├── lib/                     calculos.js, formato.js, datosDemo.js (lógica pura, sin JSX)
├── services/
│   ├── supabase.js          Cliente Supabase + Auth (login/logout/sesión)
│   └── datos.js             TODAS las funciones CRUD/RPC contra las tablas — única puerta a Supabase
├── auth/                    usuarios.js (RolContext + hooks de permiso), PantallaLogin.jsx
├── components/              UI genérica sin lógica de negocio + graficos/
├── shell/                   Header, menú config, changelog, checklist, buscador global
└── features/                Una carpeta por pestaña: materias, platos, costosFijos, ventas, pricing, reportes

supabase/migrations/         SQL versionado (esquema, RLS, funciones, migración de datos, rollback)
tests/                       Espejo de src/, ~280 tests
```

## 5. Supabase — cómo funciona

- Un solo proyecto Supabase (`zzowlamfxvxnkasfzxce`), usado por la app en producción real (datos de Juani).
- Credenciales en variables de entorno de Vite (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`), guardadas como **GitHub Actions secrets** (nunca en el código ni commiteadas — hay `.gitignore` para `.env`).
- ⚠️ La clave `anon` actual estuvo expuesta en un repo público antes de moverla a variables de entorno. RLS ya la neutraliza bastante, pero **rotarla sigue pendiente** (ver Riesgos).

## 6. Autenticación y permisos

- **Identidad:** Supabase Auth real (email + contraseña). Nada de usuarios/contraseñas hardcodeadas en el código.
- **Autorización:** tabla `memberships` (`user_id`, `company_id`, `rol`) — el rol vive ahí, no en el frontend ni en `localStorage`. Roles: `admin` (todo), `cajero` (ventas + correcciones), `visualizador` (solo lectura).
- **Enforcement real:** RLS en cada tabla, no solo ocultar botones en React. Función helper `tiene_rol(company_id, roles[])` centraliza la lógica de permiso en SQL.
- Tabla `perfiles` (`id`→auth.users, `nombre`) guarda solo el nombre para mostrar — **no tiene relación FK directa con `memberships` ni con `correcciones_ventas`**; para traer el nombre de alguien hay que consultar `perfiles` por separado y cruzar en JS (ver punto 9, esto ya rompió 2 veces).
- Cada usuario puede cambiar su propia contraseña desde el menú ⚙️ (`ModalCambiarClave.jsx`, usa `supabase.auth.updateUser`).

## 7. Modelo de datos (relacional, ya en producción)

Tablas: `companies`, `memberships`, `ingredientes`, `historial_precios`, `platos`, `plato_ingredientes` (receta), `costos_fijos`, `pedidos`, `venta_items`, `correcciones_ventas`, `categorias`, `benchmarks`, `configuracion`.

Decisiones de diseño importantes:
- **Multiempresa preparado pero no construido**: todo tiene `company_id`, hoy existe una sola empresa. `memberships` permite que a futuro una persona pertenezca a varias empresas con roles distintos, sin cambiar el esquema.
- **Borrar un ingrediente usado en una receta está BLOQUEADO** a nivel base (`ON DELETE RESTRICT` en `plato_ingredientes.ingrediente_id`) — decisión de negocio explícita: mejor avisar en el momento que dejar una receta rota en silencio.
- `correcciones_ventas.usuario_id` es un UUID real (antes era texto libre) — trazabilidad real de quién borró una venta.
- IDs siguen siendo `text` (generados por la app con `uid()`), no UUID de Postgres — así se preservó cada id existente durante la migración de datos, sin remapear nada.

## 8. Estrategia de testing

- **255 tests, Vitest, todos pasando (255/255). Comando: `npm test`.** `npm run validate` corre `npm test && npm run build` en un solo paso — usarlo antes de dar cualquier cambio por terminado.
- `services/datos.js` (21 funciones): las 21 tienen test directo (`tests/services/datos.test.js`, 39 tests), mockeando el cliente de Supabase en el límite exacto donde `datos.js` lo importa.
- `App.jsx`: tiene test propio (`tests/App.test.jsx`, 22 tests) cubriendo sus handlers de negocio principales — guardar/editar/borrar+deshacer en las 3 secciones de catálogo, ventas, categorías, benchmarks, precios masivos — con caminos de éxito y de error. Se monta `<App/>` directo (sin pasar por login), mockeando `services/datos.js` completo.
- Tests de integración (`tests/integration/app.test.jsx`, 7 tests) montan la app completa (login → sesión → datos → navegación) mockeando en el límite de servicios: `services/supabase.js` (auth) y `services/datos.js` (todas las tablas) — no hay llamada real a Supabase en ningún test.
- **E2E del flujo de negocio principal** (`tests/integration/venta-impacta-reporteria.test.jsx`, 2 tests): registrar una venta real → "Usar en Pricing" → confirma que los KPIs de Reportería (margen bruto promedio, facturación estimada) pasan de "sin datos" a números reales. Cubre la cadena completa Ventas → config.unidades → Pricing → Reportería, no cada paso por separado.
- El pipeline de GitHub Actions (`.github/workflows/deploy.yml`) ahora corre `npm test` antes de `npm run build` — un test roto frena el deploy en vez de pasar desapercibido.

## 8.1 Corrección de discrepancias — sesión 13/09/2026

Al bajar el repo real de GitHub para retomar la Etapa 4, la suite tenía 16 tests fallando en 4 archivos, todos por el mismo motivo: quedaron testeando la arquitectura vieja (pre-Etapa 2/3) que ya no existe. Se corrigió:

- `src/services/supabase.js`: se borró código muerto (`dbLeer`, `dbGuardar`, `STORAGE_KEY`, `STORAGE_KEY_BACKUP`) que apuntaba a una tabla `datos_app` (modelo de JSON único) ya abandonada — nada del código actual lo usaba.
- `tests/auth/PantallaLogin.test.jsx`: testeaba un login hardcodeado (usuario/contraseña tipo "juani"/"costos2026"). Reescrito mockeando `iniciarSesion` de `services/supabase.js` (Supabase Auth real).
- `tests/services/supabase.test.js`: testeaba `dbLeer`/`dbGuardar` con `fetch` crudo mockeado. Reescrito contra las funciones reales (`iniciarSesion`, `cerrarSesion`, `cambiarPropiaClave`, `obtenerSesion`, `alCambiarSesion`, `obtenerPerfil`), mockeando `createClient` de `@supabase/supabase-js`.
- `tests/integration/app.test.jsx`: mismo login viejo, hacía fallar los 6 tests en cadena. Reescrito con Auth real mockeada + `cargarTodo`/`obtenerMembership` mockeados (usa `datosDemo()` como dataset de prueba, que ya tiene la misma forma que devuelve `cargarTodo`). Se sumó un test nuevo (cuenta sin membership).
- `tests/features/SeccionVentas.test.jsx`: un test asumía que el componente actualizaba `data` directo con `setData` (modelo viejo). Hoy `SeccionVentas` delega el guardado en la prop `onRegistrarVenta` (que vive en `App.jsx`) — reescrito contra ese contrato real, más un test nuevo para el caso en que falla el guardado (el carrito no se vacía).

## 8.3 Feature nueva — Ordenar tablas por columna (13/09/2026, v1.17)

- **Materias primas y Costos fijos** (tablas de verdad): click en el título de cualquier columna para ordenar; un segundo click invierte a descendente. Ícono de flechas en cada columna (tenue si no está activa). Se aplica también a las tarjetas de mobile de Costos fijos.
- **Platos** (no es una tabla, son tarjetas expandibles con la receta): se agregó un selector "Ordenar por" (Nombre, Margen bruto, Precio de venta, Costo por porción) + un botón de flecha para invertir la dirección. Se decidió así explícitamente en vez de forzar un "click en columna" que no existe en ese diseño.
- Lógica reutilizable nueva: `src/lib/ordenar.js` (comparador puro, con los "sin dato" siempre al final sin importar la dirección) y `src/lib/useOrdenTabla.js` (hook de estado columna/dirección). Componente `src/components/ThOrdenable.jsx` para los headers clickeables.
- Se sumaron tests: `tests/lib/ordenar.test.js`, más casos de orden en `SeccionMaterias.test.jsx`, `SeccionFijos.test.jsx` y `SeccionPlatos.test.jsx`. Suite en 275/275.
- De paso se encontró que la documentación decía "hay un test que valida que el changelog coincide con `APP_VERSION`" pero no existía — se creó (`tests/shell/novedadesContenido.test.js`).

## 8.2 Bug real encontrado por los tests nuevos — sesión 13/09/2026

En `src/features/pricing/SeccionPricing.jsx`, la tabla que compara el margen objetivo contra valores de referencia armaba la lista como `[cfg.margenObjetivo, 50, 40]` sin sacar duplicados. Si el margen objetivo del negocio ya era 50% o 40% (un valor perfectamente normal), la fila aparecía repetida en pantalla. Se corrigió con `[...new Set([...])]` y se sumó un test de regresión en `tests/features/SeccionPricing.test.jsx`.

## 9. Decisiones técnicas importantes a recordar

- **PostgREST no puede hacer embeds automáticos sin una FK directa entre las dos tablas involucradas.** Esto ya causó 2 bugs reales en producción (`memberships`↔`perfiles` y `correcciones_ventas`↔`perfiles`). Patrón correcto: consultar por separado y cruzar en JS — **no volver a intentar `.select("*, tabla_relacionada(campo)")` entre tablas sin FK directa.**
- El estado local de React se actualiza **después** de confirmar éxito en Supabase, nunca antes (actualización optimista solo cuando es segura de revertir). Los 3 modales principales y el carrito de Ventas previenen doble-envío (deshabilitan botón + muestran "Guardando…" mientras la escritura está en curso).
- "Deshacer" (borrar ingrediente/plato/costo/venta) **recrea la fila de verdad en la base**, no solo en la pantalla.
- El changelog in-app (`novedadesContenido.js`) se actualiza en cada feature visible para el usuario — nunca con cambios de infraestructura/backend (eso queda solo en este archivo). Hay un test que valida que la versión del changelog coincide con `APP_VERSION`.

## 10. Decidido explícitamente NO construir

- **Fichada/control de asistencia de empleados** — dominio de RRHH distinto, fuera de alcance.
- **Dos apps separadas (mobile vs. desktop)** — se descartó por carga de mantenimiento desproporcionada; en cambio, se va a invertir en mejor diseño responsivo dentro del mismo código.
- **"Plan de acción" como motor de recomendaciones con autoridad** ("deberías hacer X") — se descartó por el riesgo de daño si una sugerencia mal calibrada le hace perder plata a Juani, que no tiene formación de negocios para juzgarla. La versión que sí se va a construir muestra opciones + trade-offs, nunca una decisión tomada por la app.

## 11. Riesgos y problemas conocidos

- 🟡 Clave `anon` de Supabase históricamente expuesta en un repo público — rotación pendiente, no urgente (RLS ya la limita).
- 🟡 Modo oscuro tiene fondos de color hardcodeados sin variante oscura (`VERDE_BG`/`AMARILLO_BG`/`ROJO_BG` en `config/constants.js`, afecta 14 archivos) — causa raíz encontrada, sin arreglar.
- 🟡 Navegación mobile: barra de pestañas horizontal con auto-scroll (`navScrollRef` en App.jsx) que hace "saltar" la pantalla al tocar una pestaña — causa confirmada en código.
- 🟢 Bundle de producción ~540kB (aviso de Vite por tamaño de chunk) — no urgente para el tamaño actual de la app.

## 12. Funcionalidades ya implementadas (resumen)

Materias primas (con historial de precios y actualización masiva) · Platos/recetas con cálculo de costo y margen · Costos fijos · Pricing (calculadora + aplicación masiva de precio sugerido) · Ventas por pedido (carrito, medios de pago, correcciones con auditoría) · Reportería (KPIs, ranking 80/20, benchmarks editables) · Auth real con 3 roles · Cambio de contraseña propia · Detección de ingredientes duplicados (no bloqueante) · Changelog in-app · Checklist de primeros pasos · Buscador global (Ctrl+K) · Modo oscuro (funcional, con deuda visual pendiente).

## 13. Roadmap — estado de cada etapa

| Etapa | Estado |
|---|---|
| 1. Modularización (monolito → Vite) | ✅ Completa |
| 2. Seguridad (Auth real, RLS, roles) | ✅ Completa |
| 3. Base de datos relacional + concurrencia | ✅ Completa, en producción, verificada |
| 4. QA/testing/robustez | ✅ Completa (13/09/2026) — 255/255 tests, `datos.js` y `App.jsx` con test propio, E2E venta→Reportería, `npm run validate`, CI corre tests antes de deployar. Pendiente menor: seguir sumando tests a medida que se agreguen features nuevas (no es un "terminado para siempre") |
| 5. Operación productiva / Production Readiness | ✅ Completa (18/09/2026) — ver sección 13.1 |

## 13.1 Etapa 5 — Operación productiva / Production Readiness — ✅ CERRADA (18/09/2026)

Diagnóstico inicial hecho contra el repo real (no supuestos). Hallazgos
🔴 bloqueantes encontrados: cero logging, cero monitoreo de errores, sin
migraciones de base de datos versionadas, y `ARCHITECTURE.md`
completamente desactualizado. Confirmado: proyecto de Supabase en plan
Free — sin backups automáticos de ningún tipo hasta ese momento.

Decisiones tomadas: no migrar de GitHub Pages, no armar Staging
permanente, offline = degradación controlada (sin ventas offline), no
automatizar migraciones desde CI.

**Todo lo siguiente está implementado, subido a GitHub y confirmado
funcionando en producción real** (no solo documentado — cada ítem tiene
una prueba real hecha, no una promesa):

- **Backup diario automático**: `.github/workflows/backup.yml` (`pg_dump`
  a artifact de GitHub Actions, retención 90 días, + botón para disparar
  a mano). Secret `SUPABASE_DB_URL` vía "Session pooler" de Supabase
  (usuario `postgres.<project-ref>`, con el punto — "Direct connection"
  pide add-on pago, "Transaction pooler" no soporta bien `pg_dump`). No
  cubre el esquema `auth` (Supabase lo maneja aparte).
- **Logging + monitoreo de errores (Sentry)**: `src/services/monitoreo.js`
  (no-op si no hay `VITE_SENTRY_DSN`), `ErrorBoundary` en `main.jsx`,
  `reportarError(...)` en 21 de 23 `catch` existentes (los 2 que quedan
  afuera son errores esperados del usuario, no fallas). Proyecto "la-nuna"
  en sentry.io.
- **Banner de "sin conexión"** (v1.18): `src/lib/useEnLinea.js`.
- **Flujo con Pull Request + protección de rama**: regla clásica en
  GitHub (`main`: requiere PR, 0 aprobaciones obligatorias, requiere que
  el check `build` pase). `deploy.yml` corre tests+build en PRs, el
  `deploy` real solo en push a `main`. Probado de punta a punta con
  varios PRs reales.
- **`supabase/migrations/`**: `20260914000000_esquema_inicial.sql` (línea
  base, foto del esquema real) + `20260916000000_borrar_datos_app.sql`.
  Workflows de solo lectura para sacar fotos: `exportar-esquema.yml` y
  `exportar-datos-prueba-restore.yml` (ambos con disparo manual, mismo
  secret `SUPABASE_DB_URL`).
- **Segundo proyecto de Supabase para desarrollo**: "la-nuna-desarrollo"
  (São Paulo, plan Free), con la migración inicial aplicada. Bug real
  encontrado y corregido en el camino: la función `tiene_rol` (LANGUAGE
  sql, se valida al crearse) estaba antes que la tabla `memberships` que
  consulta en el dump original — se corrigió reordenando el archivo
  (tablas antes que esa función).
- **Prueba de restore CONFIRMADA (16/09/2026)**: datos reales de las 13
  tablas de negocio (536 filas) restaurados con éxito en
  "la-nuna-desarrollo" vía SQL Editor — confirmado visualmente (101
  ingredientes reales). Se excluyeron `memberships` y `perfiles` a
  propósito (dependen de usuarios de Auth de producción que no existen en
  desarrollo). Pendiente real que queda fuera de esta etapa: la prueba
  "real" con `pg_restore` (el mecanismo que usa el backup diario, formato
  custom) recién se puede hacer cuando exista Claude Code con acceso de
  red completo — el sandbox de Claude.ai no llega a Supabase.
- **Tabla `datos_app` BORRADA de producción (18/09/2026)**: modelo viejo
  de JSON único, sin uso real confirmado. Se hizo un backup manual fresco
  antes de correr el `DROP TABLE IF EXISTS public.datos_app;` a mano en
  el SQL Editor de producción.
- **Ping de disponibilidad (18/09/2026)**: monitor "La Nuna — producción"
  en UptimeRobot (plan gratis), HTTP(S) contra
  `https://tmb98.github.io/costos-gastronomia/`, cada 5 minutos, alerta
  por mail.

No queda ningún pendiente abierto de esta etapa salvo la prueba real de
`pg_restore` mencionada arriba (bloqueada por acceso de red, no por
decisión).

## 14. Pendientes activos (sin arrancar), por tamaño

**Grandes:**
- Sesión de UX/responsivo (mobile nav + aprovechamiento de espacio desktop + modo oscuro, encarar juntos) — hay hallazgos concretos ya confirmados, ver punto 11
- Pestaña "Actividad" (solo admin) — trackear uso de la app, requiere sistema de logging nuevo
- Stock/inventario con vencimientos y notificaciones automáticas
- "Plan de acción" (opciones + trade-offs a partir de benchmarks/costos/dotación) — depende de que exista "Dotación" primero

**Medianos:**
- Dotación/estructura de personal (cantidad de empleados, cómo se les paga, valor hora, turnos)
- **Insumos secundarios / vencimientos** — diseño acordado el 19/09/2026, no arrancado: NO se agrega un campo nuevo a `ingredientes` (dos fuentes de verdad para el mismo tipo de gasto es peor, no mejor). Se separa en dos evolutivos: (1) **vencimientos** — reusar `historial_precios` sumando dos campos opcionales (cantidad comprada, fecha de vencimiento) al cargar una compra, más un cartel in-app tipo el de "sin conexión" avisando lo que vence pronto; mockup ya armado y aprobado (Design artifact `Bufku9PgSagJj1PGDpSV1R`). (2) **productivo vs no productivo** — sin clasificación manual ni algoritmo que adivine: un filtro en Materias Primas ("sin ninguna receta asociada", cruce objetivo contra `plato_ingredientes`) + un cartel de ayuda al cargar un ingrediente nuevo sugiriendo Costos Fijos si es gasto general. Arranca por vencimientos, stock queda como evolutivo aparte todavía más adelante.
- Catálogo maestro de ingredientes (autocompletar/elegir en vez de escribir libre) — la detección de duplicados actual es solo mitigación
- Comprobante liviano de venta (posible envío por mail en vez de imprimir ticket)

**Chicos:**
- ⚠️ **Hallazgo de datos (19/09/2026, no es un bug de código):** los insumos de café — vasos (8oz/12oz), tapas, agitador, collarín — están cargados en Materias Primas pero **no están enganchados a ninguna receta**. Hoy el costo/margen de Capuchino, Cafe espresso, Cafe con leche, etc. no incluye el packaging — está subestimado. Avisarle a Juani para que los agregue a mano en cada receta de café; no requiere desarrollo.
- Rotar la clave de Supabase expuesta
- Colores de marca (en stand by, decisión de negocio pendiente de Tomi)
- Reportar bug / reportar mejora desde la app

## 15. Instrucciones para futuros cambios

- **Nunca** hardcodear credenciales — todo vía `import.meta.env`, secretos en GitHub Actions.
- **Nunca** usar el patrón `.select("*, tabla(campo)")` de Supabase sin verificar que existe una FK directa entre esas dos tablas exactas.
- Toda escritura nueva va a `services/datos.js`, nunca a Supabase directo desde un componente.
- Operaciones que tocan >1 fila a la vez → función RPC en `supabase/migrations/`, no loops de llamadas sueltas desde el cliente.
- Antes de cualquier migración de esquema/datos: pedirle a Tomi que baje un respaldo desde el menú ⚙️, y avisar que se pause el uso de la app mientras se corre.
- Feature visible para el usuario → sumar entrada en `shell/novedadesContenido.js` y subir `APP_VERSION` en `config/constants.js`.
- Correr `npm test` y `npm run build` antes de dar por terminado cualquier cambio.
- Estilo de comunicación con Tomi: es no-técnico salvo lo aprendido en esta sesión — explicar en criollo, paso a paso, con capturas cuando hay que operar en GitHub/Supabase; nunca asumir que sabe un término técnico sin explicarlo.
- **Flujo de cambios (Etapa 5, 14/09/2026, DECIDIDO)**: en vez de subir archivos directo a `main`, el camino es rama nueva → Pull Request → esperar que el check `build` de CI salga verde → mergear. Se activó protección de rama en GitHub sobre `main` (Settings → Branches → regla): requiere Pull Request para mergear (0 aprobaciones obligatorias — Tomi trabaja solo, no tiene sentido pedirse aprobación a sí mismo) + requiere que el check `build` pase. `deploy.yml` se ajustó para correr tests+build también en Pull Requests (antes solo corría al llegar a `main`) pero el paso de publicar (`deploy`) solo corre en push real a `main`, nunca en un PR sin mergear — así no se pisa producción con un cambio a medio revisar. Se decidió activar esto (a pesar de sumar un paso más al flujo manual actual) porque el plan es que Claude Code termine manejando el git/PR de forma automática — la fricción de hoy es temporal.
