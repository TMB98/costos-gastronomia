import { describe, it, expect } from "vitest";
import datosDemo from "../../src/lib/datosDemo.js";

describe("datosDemo", () => {
  it("genera las 5 colecciones esperadas", () => {
    const d = datosDemo();
    expect(d.ingredientes.length).toBeGreaterThan(0);
    expect(d.platos.length).toBeGreaterThan(0);
    expect(d.costosFijos.length).toBeGreaterThan(0);
    expect(d.ventas.length).toBeGreaterThan(0);
    expect(d.config).toBeTruthy();
  });

  it("todo ingredId referenciado en las recetas de los platos existe en la lista de ingredientes", () => {
    const d = datosDemo();
    const idsIngredientes = new Set(d.ingredientes.map((i) => i.id));
    d.platos.forEach((p) => {
      p.items.forEach((it) => {
        expect(idsIngredientes.has(it.ingId)).toBe(true);
      });
    });
  });

  it("todo platoId referenciado en las ventas existe en la lista de platos", () => {
    const d = datosDemo();
    const idsPlatos = new Set(d.platos.map((p) => p.id));
    d.ventas.forEach((v) => {
      expect(idsPlatos.has(v.platoId)).toBe(true);
    });
  });

  it("cada llamada genera ids únicos (no reutiliza referencias entre llamadas)", () => {
    const d1 = datosDemo();
    const d2 = datosDemo();
    expect(d1.platos[0].items[0].id).not.toBe(d2.platos[0].items[0].id);
  });

  it("la config trae categorías y benchmarks por defecto", () => {
    const d = datosDemo();
    expect(d.config.categoriasIngredientes.length).toBeGreaterThan(0);
    expect(d.config.benchmarks.length).toBeGreaterThan(0);
    expect(d.config.margenObjetivo).toBe(65);
  });
});
