# Arquitectura — Costos Gastronomía

Guía rápida para orientarse sin tener que leer todo el proyecto. Si vas a
modificar algo, buscá primero tu caso en **"¿Dónde toco esto?"** al final.

> Para el ESTADO del proyecto (qué está hecho, qué falta, decisiones de
> negocio, roadmap) la fuente de verdad es **`PROJECT_CONTEXT.md`**, no este
> archivo. Este documento es solo mapa de código — estructura y
> convenciones, no estado ni roadmap. Mantenerlos separados así evita que
> uno mienta por desactualización mientras el otro se actualiza (ya pasó
> una vez: este archivo describió durante un tiempo una arquitectura que
> ya no existía).

## Qué es

Calculadora de costos y precios para un negocio gastronómico real: ingredientes
→ recetas → costos fijos → pricing → ventas → reportería. React + Vite,
sin backend propio — persiste en Supabase (Postgres + Auth + RLS + funciones
RPC), con un esquema relacional real (no un JSON único).

## Estructura del proyecto

```
src/
├── main.jsx                Punto de entrada. Monta <AppConLogin />.
├── AppConLogin.jsx           Maneja sesión real de Supabase Auth (login/logout,
│                            onAuthStateChange) + resuelve la membership del
│                            usuario (empresa + rol), envuelve <App /> en RolContext.
├── App.jsx                   El orquestador: estado global (data), todos los
│                            handlers de negocio (crear/editar/borrar+deshacer),
│                            cálculos derivados (platosCalc, totales, totalCF),
│                            y el layout (header, nav, pestañas, modales, toasts).
│
├── config/
│   └── constants.js         Colores, unidades, categorías por defecto, inputCls,
│                            APP_VERSION.
│
├── lib/                      Lógica de negocio PURA — sin JSX, sin estado, 100%
│   │                        testeable.
│   ├── calculos.js            calcPlato, costoLinea, semaforo, netoDe, conIVA,
│   │                          cfMensual, precioEnFecha, estadoAjuste.
│   ├── formato.js             $, $0, pct1, fechaCorta, hoyISO, uid, nf0/nf2.
│   ├── ordenar.js              compararValores, ordenarLista (ordenamiento de tablas).
│   ├── useOrdenTabla.js         Hook de estado columna/dirección para ordenar.
│   ├── useEnLinea.js            Hook de conexión (navigator.onLine + eventos
│   │                           online/offline) — alimenta el banner de "sin
│   │                           conexión" en App.jsx.
│   └── datosDemo.js            Genera un dataset de ejemplo (default export).
│
├── services/                 ÚNICA puerta a Supabase — nada más en el proyecto
│   │                        debería hacer fetch()/llamar al cliente directo.
│   ├── supabase.js            Cliente de Supabase + Auth: iniciarSesion,
│   │                          cerrarSesion, cambiarPropiaClave, obtenerSesion,
│   │                          alCambiarSesion, obtenerPerfil, dbConfigurada.
│   ├── datos.js                Las 21 funciones CRUD/RPC contra las tablas
│                              relacionales (ingredientes, platos, ventas, etc.)
│                              — ver PROJECT_CONTEXT.md punto 7 para el modelo
│                              de datos completo.
│   └── monitoreo.js             Sentry: iniciarMonitoreo(), reportarError(...),
│                               LimiteDeErrores (ErrorBoundary). No-op total si
│                               no hay VITE_SENTRY_DSN — nunca rompe tests/dev.
│
├── auth/
│   ├── usuarios.js            RolContext + hooks de permiso: usePuedeEditar,
│   │                          usePuedeVentas, useEsAdmin. El rol viene de la
│   │                          tabla `memberships` en Supabase, no de acá.
│   └── PantallaLogin.jsx       Formulario de login real (email + contraseña).
│
├── components/                UI genérica reutilizable, SIN lógica de negocio.
│   ├── icons.jsx                Íconos SVG de línea, como componentes.
│   ├── Modal.jsx, Boton.jsx, Tarjeta.jsx, Campo.jsx, Chip.jsx, KPI.jsx,
│   │   ConTooltip.jsx, SelectConAgregar.jsx, AyudaSeccion.jsx, Formula.jsx,
│   │   ThOrdenable.jsx (header de tabla clickeable para ordenar)
│   └── graficos/                BarraH.jsx, PieConLeyenda.jsx, LineaSVG.jsx (SVG a mano).
│
├── shell/                     El "marco" de la app — no es una pestaña, es lo
│   │                         que la rodea.
│   ├── MenuConfiguracion.jsx     Menú de la tuerca: tema, cambiar contraseña,
│   │                            cerrar sesión.
│   ├── ModalCambiarClave.jsx      Cambio de la propia contraseña (Supabase Auth).
│   ├── CampanaNovedades.jsx       Historial de cambios (usa novedadesContenido.js).
│   ├── ModalManual.jsx            Manual de usuario (usa manualContenido.js).
│   ├── ChecklistPrimerosPasos.jsx
│   └── BuscadorGlobal.jsx        Buscador Ctrl+K.
│
└── features/                  Una carpeta por pestaña — el punto de entrada
                               para "modificá X".
    ├── materias/                SeccionMaterias, ModalIngrediente,
    │                           ModalHistorialPrecio, ModalPreciosMasivo.
    ├── platos/                  SeccionPlatos (tarjetas expandibles, NO tabla —
    │                           tiene selector "Ordenar por" en vez de headers
    │                           clickeables), ModalPlato.
    ├── costosFijos/             SeccionFijos (tabla real), ModalCostoFijo.
    ├── ventas/                  SeccionVentas (pedidos, carrito, correcciones,
    │                           ganancia real, ranking 80/20, "Usar en Pricing" —
    │                           todo en un archivo, es la sección más grande).
    ├── pricing/                 SeccionPricing (calculadora de precio sugerido,
    │                           veredictos, aplicar precios masivos).
    └── reportes/                SeccionReportes (KPIs, benchmarks editables,
                                paneles).

tests/                         Misma estructura que src/, en espejo. 270 tests.
```

## Dónde vive cada cosa

- **Estado global**: todo en `App.jsx` (`useState(data)`), cargado una vez desde
  `cargarTodo(companyId)` al loguearse. Las secciones reciben `data` y los
  handlers por props — no hay Context para los datos de negocio (solo para el
  rol, vía `RolContext`).
- **Persistencia**: cada acción de escritura pega directo a su tabla específica
  vía `services/datos.js` — no hay un JSON único que se reescribe entero.
  El estado local de React se actualiza recién **después** de que Supabase
  confirma éxito, nunca antes (así una falla de red no muestra un guardado
  que no ocurrió).
- **Lógica de negocio (cálculos)**: siempre en `lib/calculos.js`, nunca dentro
  de un componente de sección — así queda testeable sin renderizar nada.
- **Comunicación con Supabase**: únicamente en `services/supabase.js` (auth) y
  `services/datos.js` (datos). Ningún componente debería importar
  `@supabase/supabase-js` directo.
- **Permisos por rol**: los hooks `usePuedeEditar` / `usePuedeVentas` /
  `useEsAdmin` (de `auth/usuarios.js`) se llaman donde haga falta gatear un
  botón o una acción. El patrón es siempre "ocultar el control", no solo
  deshabilitarlo (salvo los inputs de Pricing, que se deshabilitan para que
  el visualizador vea la config sin poder tocarla).
- **Datos calculados a nivel app** (`platosCalc`, `totalCF`, `totales`,
  `cfPorPorcion`): se calculan una sola vez en `App.jsx` y se pasan por props.
  Ninguna sección debería recalcular esto por su cuenta.

## Dependencias principales

- `react`, `react-dom` — sin librería de routing (el "ruteo" es un
  `useState(tab)` simple).
- `@supabase/supabase-js` — cliente de Supabase (Postgres + Auth + RLS + RPC).
- `vite` + `@vitejs/plugin-react` — build. `base: "./"` en `vite.config.js`
  para que funcione servido desde GitHub Pages en una subcarpeta.
- `tailwindcss` — estilos (config en `tailwind.config.js`, variables de color
  adaptables a modo oscuro en `src/styles.css`).
- `vitest` + `jsdom` — tests. Los tests de componentes montan con
  `react-dom/client` + `act` de `react` (no `react-dom/test-utils`, que está
  deprecado) — no hay `@testing-library/react` instalado, se usa DOM crudo
  (`querySelector`, `dispatchEvent`). Toda la capa de Supabase se mockea con
  `vi.mock` — ningún test toca la red real.

## Qué revisar según el área que quieras modificar

| Pedido | Archivos a mirar |
|---|---|
| "Modificá Ventas" | `features/ventas/SeccionVentas.jsx` + su test. Si toca borrado/correcciones, también `App.jsx` (`borrarPedidoVenta`) y `services/datos.js` (`borrarPedido`, `deshacerBorradoPedido`). |
| "Modificá el cálculo de costo de un plato" | `lib/calculos.js` (`calcPlato`, `costoLinea`) — un solo lugar, afecta Platos/Pricing/Reportería/Ventas por igual. |
| "Modificá cómo se guarda en Supabase" | `services/datos.js` (datos) o `services/supabase.js` (auth) únicamente. |
| "Agregá un campo a ingredientes/platos/costos" | El modal correspondiente en `features/<sección>/Modal*.jsx`, la función de `services/datos.js` que lo inserta/actualiza, `lib/datosDemo.js`, y probablemente una migración SQL nueva (ver `supabase/migrations/`). |
| "Cambiá quién puede hacer qué" | `auth/usuarios.js` (agregar rol/hook) + la tabla `memberships` en Supabase + gatear en el/los componentes que correspondan. |
| "Agregá una pestaña nueva" | Nueva carpeta en `features/`, agregarla a `TABS` en `App.jsx`, agregar el render condicional por `tab === "..."`. |
| "Cambiá un color/estilo global" | `config/constants.js` (tokens de color) o `src/styles.css` (variables CSS de modo oscuro). |
| "Cambiá el manual de usuario / changelog" | `shell/manualContenido.js` / `shell/novedadesContenido.js` — son datos, no componentes. Si es changelog, también subir `APP_VERSION` en `config/constants.js`. |
| "Agregá/ordená una tabla" | `lib/ordenar.js` + `lib/useOrdenTabla.js` + `components/ThOrdenable.jsx` — ya están armados, reutilizar en vez de reinventar. |

## Cosas a saber antes de tocar código

- **`sugerido()` está duplicada** en `SeccionPricing.jsx` y
  `SeccionReportes.jsx`, con comportamiento LIGERAMENTE distinto (una tiene
  guarda para margen≥100%, la otra no). Es intencional no haberla unificado
  — hacerlo cambiaría el comportamiento de una de las dos. Si tocás la
  fórmula de precio sugerido, revisá ambos lugares.
- **PostgREST no puede hacer embeds automáticos** (`.select("*, tabla(campo)")`)
  sin una FK directa entre las dos tablas. Ya causó 2 bugs reales
  (`memberships`↔`perfiles`, `correcciones_ventas`↔`perfiles`). Patrón
  correcto: consultar por separado y cruzar en JS.
- **`platosCalc`** siempre viene con campos calculados mezclados
  (`costoTotal`, `margen`, `sem`, `neto`, etc.) además de los campos reales
  del plato. Si vas a guardar un plato de vuelta, reconstruilo con solo los
  campos reales (ver `duplicarPlato` en `App.jsx` como referencia).
- **IDs son `text`** (generados con `uid()`), no UUID de Postgres — se
  preservó así para no remapear nada durante la migración de datos.

## Testing

`npm test` corre todo con Vitest (270 tests). `npm run validate` corre tests +
build en un solo comando — usarlo antes de dar cualquier cambio por
terminado. Cobertura fuerte en `lib/` (cálculos puros), en `services/datos.js`
(las 21 funciones, mockeando el cliente de Supabase), en `App.jsx` (handlers
de negocio principales), y un test de integración
(`tests/integration/app.test.jsx`) que monta la app completa con login,
sesión y navegación — todo mockeado en el límite de servicios, ninguna
llamada real a Supabase en ningún test.

## Deploy

GitHub Actions (`.github/workflows/deploy.yml`) → GitHub Pages. `main` está
protegida: todo cambio va por rama → Pull Request → el check `build` (tests +
compilación) tiene que salir verde → merge. El paso de publicar corre solo en
push real a `main` (nunca en un PR sin mergear). Otros workflows de solo
lectura, disparo manual, en `.github/workflows/`: `backup.yml` (backup diario
de la base), `exportar-esquema.yml` y `exportar-datos-prueba-restore.yml`
(sacar fotos de esquema/datos para migraciones). Ver
`PROJECT_CONTEXT.md` para el estado de CI/CD, ambientes, backups y el resto
de la operación productiva (Etapa 5).
