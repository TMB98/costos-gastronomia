const nf2 = new Intl.NumberFormat("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const nf0 = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });

export { nf0, nf2 };

export const $ = (n) => (n == null || isNaN(n) ? "—" : "$" + nf2.format(n));
export const $0 = (n) => (n == null || isNaN(n) ? "—" : "$" + nf0.format(n));
export const pct1 = (n) => (n == null || isNaN(n) || !isFinite(n) ? "—" : n.toFixed(1).replace(".", ",") + "%");
export const hoyISO = () => new Date().toISOString().slice(0, 10);
export const fechaCorta = (iso) => (iso ? iso.split("-").reverse().join("/") : "—");
export const uid = (p) => p + "_" + Math.random().toString(36).slice(2, 9);
