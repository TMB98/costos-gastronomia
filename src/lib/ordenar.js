// Lógica pura de ordenamiento, sin JSX — reutilizada por Materias primas,
// Costos fijos (tablas con columnas clickeables) y Platos (selector "Ordenar por").

// Compara dos valores de cualquier tipo, con los "sin dato" (null/undefined)
// siempre al final sin importar la dirección — así nunca tapan arriba de todo
// a los ítems que sí tienen el dato cargado.
export function compararValores(a, b) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "string" && typeof b === "string") return a.localeCompare(b, "es", { sensitivity: "base" });
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

// Devuelve una copia ordenada de la lista. `obtenerValor` extrae el campo a
// comparar de cada ítem (para poder ordenar por campos calculados, no solo
// los que ya vienen en el objeto).
export function ordenarLista(lista, obtenerValor, direccion = "asc") {
  const factor = direccion === "desc" ? -1 : 1;
  return [...lista].sort((a, b) => {
    const va = obtenerValor(a);
    const vb = obtenerValor(b);
    // Los "sin dato" van al final siempre, sin importar la dirección — el
    // factor de asc/desc solo se aplica quando ambos valores existen.
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    return factor * compararValores(va, vb);
  });
}
