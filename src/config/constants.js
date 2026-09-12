/* ══════════════════════════════════════════════════════════════
   TOKENS DE COLOR
   ══════════════════════════════════════════════════════════════ */
export const NAVY = "#1B3A6B";
export const NAVY_SOFT = "#2C5296";
// NAVY_TEXT: para usar como COLOR DE TEXTO (no de fondo). A diferencia de NAVY
// (que sigue sirviendo perfecto para fondos, como el header o los botones
// primarios), este valor cambia solo en modo oscuro vía variable CSS —
// en modo claro es el mismo navy de siempre, en modo oscuro se aclara para
// no perderse contra fondos oscuros.
export const NAVY_TEXT = "var(--navy-text)";
export const NAVY_BG_SOFT = "var(--navy-bg-soft)";
// Mismo criterio que NAVY_TEXT: estos "700" son colores pensados para texto
// sobre fondo blanco. En modo oscuro se aclaran solos vía CSS para seguir
// siendo legibles contra fondos oscuros, sin tocar los usos como fondo/chip
// (esos siguen con VERDE/ROJO/AMARILLO de siempre, que ahí sí están bien).
export const VERDE_TEXT = "var(--verde-text)";
export const ROJO_TEXT = "var(--rojo-text)";
export const AMARILLO_TEXT = "var(--amarillo-text)";
export const VERDE = "#15803d";
export const AMARILLO = "#b45309";
export const ROJO = "#b91c1c";
export const VERDE_BG = "#dcfce7";
export const AMARILLO_BG = "#fef3c7";
export const ROJO_BG = "#fee2e2";
export const PALETA = ["#1B3A6B", "#2C5296", "#3E7CC4", "#6FA8DC", "#9FC5E8", "#b45309", "#d97706", "#f59e0b", "#15803d", "#4ade80"];

/* ══════════════════════════════════════════════════════════════
   UNIDADES Y CONVERSIONES
   ══════════════════════════════════════════════════════════════ */
export const UNIDADES = {
  kg: { grupo: "masa", f: 1 },
  g: { grupo: "masa", f: 0.001 },
  litro: { grupo: "volumen", f: 1 },
  ml: { grupo: "volumen", f: 0.001 },
  unidad: { grupo: "conteo", f: 1 },
  docena: { grupo: "conteo", f: 12 },
};
export const LISTA_UNIDADES = Object.keys(UNIDADES);
export const unidadesCompatibles = (u) =>
  LISTA_UNIDADES.filter((x) => UNIDADES[x].grupo === UNIDADES[u]?.grupo);

export const CAT_ING = ["Lácteos", "Carnes", "Verduras", "Secos", "Bebidas", "Otros"];
export const CAT_PLATO = ["Entrada", "Principal", "Postre", "Bebida", "Menú del día", "Otro"];
export const CAT_COSTO_DEFAULT = [
  "Alquiler", "Servicios", "Personal / sueldos", "Seguro",
  "Mantenimiento", "Impuestos y tasas", "Marketing", "Otros",
];
export const FRECUENCIAS = { mensual: 1, trimestral: 3, anual: 12 };

export const APP_VERSION = "1.16";

// Clase compartida para todos los inputs/selects de formularios (48 usos en
// el monolito original) — un solo lugar para el estilo base de un campo.
export const inputCls = "w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600";
