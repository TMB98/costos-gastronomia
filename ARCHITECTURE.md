# Arquitectura — Costos Gastronomía

Guía rápida para orientarse sin tener que leer todo el proyecto. Si vas a modificar algo,
buscá primero tu caso en la sección **"¿Dónde toco esto?"** al final.

## Qué es

Calculadora de costos y precios para un negocio gastronómico: ingredientes → recetas →
costos fijos → pricing → ventas → reportería. React + Vite, sin backend propio — persiste
en Supabase (una fila con todo el estado como JSON) con localStorage como respaldo.

## Estructura del proyecto

```
src/
├── main.jsx              Punto de entrada. Monta <AppConLogin />.
├── AppConLogin.jsx        Maneja la sesión (login/logout) y envuelve <App /> en RolContext.
├── App.jsx                 El orquestador: estado global, persistencia, todos los handlers
│                           CRUD, y el layout (header, nav, pestañas, modales, toasts).
│
├── config/
│   └── constants.js        Colores, unidades, categorías por defecto, inputCls, APP_VERSION.
│
├── lib/                    Lógica de negocio PURA — sin JSX, sin estado, 100% testeable.
│   ├── calculos.js          calcPlato, costoLinea, semaforo, netoDe, conIVA, cfMensual,
│   │                        precioEnFecha, estadoAjuste.
│   ├── formato.js           $, $0, pct1, fechaCorta, hoyISO, uid, nf0/nf2.
│   └── datosDemo.js         Genera el dataset de ejemplo (default export).
│
├── services/
│   └── supabase.js          TODA la comunicación con Supabase vive acá: dbLeer, dbGuardar,
│                            dbConfigurada, claves de localStorage. Nada más en el proyecto
│                            debería hacer fetch() a Supabase directamente.
│
├── auth/
│   ├── usuarios.js          USUARIOS (lista hardcodeada), LOGIN_STORAGE_KEY, RolContext,
│   │                        y los hooks de permisos: usePuedeEditar, usePuedeVentas, useEsAdmin.
│   └── PantallaLogin.jsx    Formulario de login.
│
├── components/              UI genérica reutilizable, SIN lógica de negocio.
│   ├── icons.jsx             31 íconos SVG de línea, como componentes.
│   ├── Modal.jsx, Boton.jsx, Tarjeta.jsx, Campo.jsx, Chip.jsx, KPI.jsx,
│   │   ConTooltip.jsx, SelectConAgregar.jsx, AyudaSeccion.jsx, Formula.jsx
│   └── graficos/             BarraH.jsx, PieConLeyenda.jsx, LineaSVG.jsx (SVG a mano).
│
├── shell/                   El "marco" de la app — no es una pestaña, es lo que la rodea.
│   ├── MenuConfiguracion.jsx    Menú de la tuerca: tema, respaldo, restaurar, cerrar sesión.
│   ├── CampanaNovedades.jsx     Historial de cambios (usa novedadesContenido.js).
│   ├── ModalManual.jsx          Manual de usuario (usa manualContenido.js).
│   ├── ChecklistPrimerosPasos.jsx
│   └── BuscadorGlobal.jsx       Buscador Ctrl+K.
│
└── features/                 Una carpeta por pestaña — el punto de entrada para "modificá X".
    ├── materias/               SeccionMaterias, ModalIngrediente, ModalHistorialPrecio,
    │                          ModalPreciosMasivo.
    ├── platos/                 SeccionPlatos, ModalPlato.
    ├── costosFijos/            SeccionFijos, ModalCostoFijo.
    ├── ventas/                 SeccionVentas (pedidos, carrito, correcciones, ganancia real,
    │                          ranking 80/20 — todo en un archivo, es la sección más grande).
    ├── pricing/                SeccionPricing (calculadora de precio sugerido, veredictos).
    └── reportes/                SeccionReportes (resumen ejecutivo + paneles bloqueados).

tests/                       Misma estructura que src/, en espejo.
```

## Dónde vive cada cosa

- **Estado global y persistencia**: todo en `App.jsx`. Es el único componente con `useState(data)`
  — todas las secciones reciben `data` y `setData` por props, no hay Context para los datos
  (solo para el rol, vía `RolContext`).
- **Lógica de negocio (cálculos)**: siempre en `lib/calculos.js`, nunca dentro de un componente
  de sección — así queda testeable sin renderizar nada.
- **Comunicación con Supabase**: únicamente en `services/supabase.js`.
- **Permisos por rol**: los hooks `usePuedeEditar` / `usePuedeVentas` / `useEsAdmin` (de
  `auth/usuarios.js`) se llaman donde haga falta gatear un botón o una acción. El patrón es
  siempre "ocultar el control", no solo deshabilitarlo (salvo los inputs de Pricing, que se
  deshabilitan para que el visualizador vea la config sin poder tocarla).
- **Datos calculados a nivel app** (`platosCalc`, `totalCF`, `totales`, `cfPorPorcion`,
  `prorrateoSinDatos`): se calculan una sola vez en `App.jsx` y se pasan por props a las
  secciones que los necesitan. Ninguna sección debería recalcular esto por su cuenta.

## Dependencias principales

- `react`, `react-dom` — sin librería de routing (el "ruteo" es un `useState(tab)` simple).
- `vite` + `@vitejs/plugin-react` — build.
- `tailwindcss` — estilos (config en `tailwind.config.js`, variables de color adaptables a
  modo oscuro en `src/styles.css`).
- `vitest` + `jsdom` — tests. Los tests de componentes montan con `react-dom/client` +
  `act` de `react` (no `react-dom/test-utils`, que está deprecado) — no hay
  `@testing-library/react` instalado, se usa DOM crudo (`querySelector`, `dispatchEvent`).

## Qué revisar según el área que quieras modificar

| Pedido | Archivos a mirar |
|---|---|
| "Modificá Ventas" | `features/ventas/SeccionVentas.jsx` + su test. Si toca borrado/correcciones, también `App.jsx` (`borrarPedidoVenta`). |
| "Modificá el cálculo de costo de un plato" | `lib/calculos.js` (`calcPlato`, `costoLinea`) — un solo lugar, afecta Platos/Pricing/Reportería/Ventas por igual. |
| "Modificá cómo se guarda en Supabase" | `services/supabase.js` únicamente. |
| "Agregá un campo a ingredientes/platos/costos" | El modal correspondiente en `features/<seccion>/Modal*.jsx`, y probablemente `lib/datosDemo.js` para que el dato de ejemplo lo tenga. |
| "Cambiá quién puede hacer qué" | `auth/usuarios.js` (agregar rol/hook) + gatear en el/los componentes que correspondan. |
| "Agregá una pestaña nueva" | Nueva carpeta en `features/`, agregarla a `TABS` en `App.jsx`, agregar el render condicional por `tab === "..."`. |
| "Cambiá un color/estilo global" | `config/constants.js` (tokens de color) o `src/styles.css` (variables CSS de modo oscuro). |
| "Cambiá el manual de usuario / changelog" | `shell/manualContenido.js` / `shell/novedadesContenido.js` — son datos, no componentes. |

## Cosas a saber antes de tocar código

- **`sugerido()` está duplicada** en `SeccionPricing.jsx` y `SeccionReportes.jsx`, con
  comportamiento LIGERAMENTE distinto (una tiene guarda para margen≥100%, la otra no). Es
  intencional no haberla unificado — hacerlo cambiaría el comportamiento de una de las dos.
  Si tocás la fórmula de precio sugerido, revisá ambos lugares.
- **El botón "Usar en Pricing"** (en Ventas) tuvo un bug real ya corregido: la función que lo
  gatea (`puedeEditar`) tiene que estar declarada en el componente que la usa — si se mueve
  código entre secciones, revisar que los hooks de permisos usados sigan importados.
- **Historial de precios**: la lógica de cuándo agregar una entrada nueva (y con qué fecha)
  vive en `ModalIngrediente.jsx` (`guardar()`) y en `App.jsx` (`aplicarPreciosMasivo`) por
  separado — mismo criterio, dos lugares porque son flujos distintos (editar uno vs. varios).
- **`platosCalc`** siempre viene con campos calculados mezclados (`costoTotal`, `margen`,
  `sem`, `neto`, etc.) además de los campos reales del plato. Si vas a guardar un plato de
  vuelta en `data.platos`, reconstruilo con solo los campos reales (ver `duplicarPlato` en
  `App.jsx` como referencia de qué campos son "de verdad").

## Testing

`npm test` corre todo con Vitest. ~185 tests — cobertura fuerte en `lib/` (cálculos puros) y
en cada sección con datos armados a mano para verificar la matemática exacta (no solo "que
renderice"). Los tests de integración (`tests/integration/app.test.jsx`) montan la app
completa con login real y navegación entre pestañas — ahí `fetch` está mockeado para fallar
rápido (la app tiene credenciales reales de Supabase hardcodeadas, así que sin mockear
intentaría red real en cada test).

## Deploy

**Pendiente de definir con el usuario.** El monolito viejo (`index.html` standalone) se
subía tal cual a GitHub Pages. Este proyecto necesita un paso de build (`npm run build` →
`dist/`) antes de publicar — hay que decidir si se hace a mano o con GitHub Actions.
