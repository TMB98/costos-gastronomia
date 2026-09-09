import { UNIDADES, FRECUENCIAS, VERDE, VERDE_BG, AMARILLO, AMARILLO_BG, ROJO, ROJO_BG } from "../config/constants.js";
import { hoyISO } from "./formato.js";

export function costoLinea(item, ing) {
  if (!ing) return { costo: null, error: "El ingrediente ya no existe en la lista" };
  if (ing.precio == null || ing.precio === "" || isNaN(ing.precio))
    return { costo: null, error: `"${ing.nombre}" no tiene precio cargado` };
  const ur = UNIDADES[item.unidad], ui = UNIDADES[ing.unidad];
  if (!ur || !ui) return { costo: null, error: "Unidad desconocida" };
  if (ur.grupo !== ui.grupo)
    return { costo: null, error: `No se puede convertir ${item.unidad} a ${ing.unidad} en "${ing.nombre}"` };
  const cant = Number(item.cantidad);
  if (isNaN(cant) || cant <= 0) return { costo: null, error: `Cantidad inválida en "${ing.nombre}"` };
  return { costo: cant * ur.f * (Number(ing.precio) / ui.f), error: null };
}

export function calcPlato(plato, mapIng) {
  const detalle = plato.items.map((it) => {
    const ing = mapIng[it.ingId];
    const r = costoLinea(it, ing);
    return { ...it, ing, ...r };
  });
  const errores = detalle.filter((d) => d.error).map((d) => d.error);
  const costoTotal = detalle.reduce((a, d) => a + (d.costo || 0), 0);
  const porciones = Number(plato.porciones) > 0 ? Number(plato.porciones) : 1;
  return {
    detalle, errores, costoTotal,
    costoPorcion: costoTotal / porciones,
    incompleto: errores.length > 0,
    porciones,
  };
}

export const netoDe = (precio, cfg) =>
  cfg.preciosIncluyenIVA ? Number(precio || 0) / (1 + Number(cfg.iva) / 100) : Number(precio || 0);
export const conIVA = (neto, cfg) => neto * (1 + Number(cfg.iva) / 100);

export function semaforo(margen) {
  if (margen == null || isNaN(margen)) return { nivel: "sin", label: "Sin datos", color: "#64748b", bg: "#f1f5f9", emoji: "⚪" };
  if (margen > 65) return { nivel: "ok", label: "Rentable", color: VERDE, bg: VERDE_BG, emoji: "🟢" };
  if (margen >= 40) return { nivel: "medio", label: "Aceptable", color: AMARILLO, bg: AMARILLO_BG, emoji: "🟡" };
  return { nivel: "riesgo", label: "Revisar", color: ROJO, bg: ROJO_BG, emoji: "🔴" };
}

export const cfMensual = (c) => Number(c.monto || 0) / FRECUENCIAS[c.frecuencia || "mensual"];

export function precioEnFecha(ing, fecha) {
  if (!ing.historial || !ing.historial.length) return ing.precio;
  const previos = ing.historial.filter((h) => h.fecha <= fecha);
  if (previos.length) return previos[previos.length - 1].precio;
  return ing.historial[0].precio;
}

// Estado del recordatorio de "próximo ajuste" de un costo fijo: null si no aplica,
// "vencido" si ya pasó la fecha, "pronto" si faltan 30 días o menos.
export function estadoAjuste(fechaISO) {
  if (!fechaISO) return null;
  const hoy = new Date(hoyISO());
  const fecha = new Date(fechaISO);
  const dias = Math.round((fecha - hoy) / 86400000);
  if (dias < 0) return { tipo: "vencido", dias: Math.abs(dias) };
  if (dias <= 30) return { tipo: "pronto", dias };
  return null;
}
