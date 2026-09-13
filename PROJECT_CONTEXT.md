# PROJECT_CONTEXT.md — La Nuna (gestión gastronómica)

> Handoff para continuar el desarrollo en una conversación nueva. Refleja el estado real al 13/09/2026. Ante cualquier contradicción con documentación vieja, este archivo manda.

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

- **~280 tests, Vitest.** Comando: `npm test`.
- Todas las funciones de `services/datos.js` (21) tienen test directo mockeando el cliente Supabase.
- `App.jsx` tiene test propio (18 tests) cubriendo sus ~17 handlers de negocio, con caminos de éxito y de error.
- Tests de integración (`tests/integration/`) montan la app completa (login → sesión → datos → navegación) mockeando Supabase en el límite de red.
- **Pendiente de esta etapa** (no arrancado): E2E de un flujo completo (venta → impacta Reportería), comando único `npm run validate` (build + tests), documentar la estrategia en este mismo archivo con más detalle si hace falta.

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
| 4. QA/testing/robustez | 🟡 En curso — auditoría hecha, tests de App.jsx y datos.js sumados, 2 bugs de robustez arreglados (carrito de ventas, doble-click en modales). Falta: E2E, `npm run validate`, documentación de testing |

## 14. Pendientes activos (sin arrancar), por tamaño

**Grandes:**
- Sesión de UX/responsivo (mobile nav + aprovechamiento de espacio desktop + modo oscuro, encarar juntos) — hay hallazgos concretos ya confirmados, ver punto 11
- Pestaña "Actividad" (solo admin) — trackear uso de la app, requiere sistema de logging nuevo
- Stock/inventario con vencimientos y notificaciones automáticas
- "Plan de acción" (opciones + trade-offs a partir de benchmarks/costos/dotación) — depende de que exista "Dotación" primero

**Medianos:**
- Dotación/estructura de personal (cantidad de empleados, cómo se les paga, valor hora, turnos)
- Catálogo maestro de ingredientes (autocompletar/elegir en vez de escribir libre) — la detección de duplicados actual es solo mitigación
- Comprobante liviano de venta (posible envío por mail en vez de imprimir ticket)

**Chicos:**
- Ordenar tablas por columna (Materias primas, Platos, Costos fijos — mismo gesto en las 3)
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
