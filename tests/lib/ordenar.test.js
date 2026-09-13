import { describe, it, expect } from "vitest";
import { compararValores, ordenarLista } from "../../src/lib/ordenar.js";

describe("compararValores", () => {
  it("compara números", () => {
    expect(compararValores(1, 2)).toBeLessThan(0);
    expect(compararValores(2, 1)).toBeGreaterThan(0);
    expect(compararValores(5, 5)).toBe(0);
  });

  it("compara strings ignorando mayúsculas y con alfabeto en español", () => {
    expect(compararValores("harina", "Azúcar")).toBeGreaterThan(0);
    expect(compararValores("azúcar", "AZÚCAR")).toBe(0);
  });

  it("los valores null/undefined siempre quedan al final, sin importar el orden de los argumentos", () => {
    expect(compararValores(null, 5)).toBeGreaterThan(0);
    expect(compararValores(5, null)).toBeLessThan(0);
    expect(compararValores(undefined, "x")).toBeGreaterThan(0);
    expect(compararValores(null, null)).toBe(0);
  });
});

describe("ordenarLista", () => {
  const items = [
    { id: "a", nombre: "Harina", precio: 1000 },
    { id: "b", nombre: "Azúcar", precio: null },
    { id: "c", nombre: "Sal", precio: 500 },
  ];

  it("ordena ascendente por defecto", () => {
    const resultado = ordenarLista(items, (i) => i.nombre.toLowerCase());
    expect(resultado.map((i) => i.id)).toEqual(["b", "a", "c"]);
  });

  it("ordena descendente cuando se pide", () => {
    const resultado = ordenarLista(items, (i) => i.nombre.toLowerCase(), "desc");
    expect(resultado.map((i) => i.id)).toEqual(["c", "a", "b"]);
  });

  it("los sin precio (null) quedan al final tanto en asc como en desc", () => {
    expect(ordenarLista(items, (i) => i.precio, "asc").map((i) => i.id)).toEqual(["c", "a", "b"]);
    expect(ordenarLista(items, (i) => i.precio, "desc").map((i) => i.id)).toEqual(["a", "c", "b"]);
  });

  it("no muta la lista original", () => {
    const original = [...items];
    ordenarLista(items, (i) => i.nombre);
    expect(items).toEqual(original);
  });
});
