import { describe, it, expect } from "vitest";
import { costoLinea, calcPlato, netoDe, conIVA, semaforo, cfMensual, precioEnFecha } from "../../src/lib/calculos.js";

describe("costoLinea: conversión de unidades", () => {
  it("kg a g calcula bien (500g de un ingrediente a $1000/kg = $500)", () => {
    const ing = { nombre: "Harina", unidad: "kg", precio: 1000 };
    const item = { unidad: "g", cantidad: 500 };
    const r = costoLinea(item, ing);
    expect(r.error).toBeNull();
    expect(r.costo).toBe(500);
  });

  it("BUG CRÍTICO POTENCIAL: cargar en kg cuando es en g no se detecta (caso real de Juan)", () => {
    // La app no puede "adivinar" la intención del usuario — si carga la unidad
    // mal, el cálculo es matemáticamente correcto para lo ingresado, aunque
    // el resultado no tenga sentido de negocio. No es un bug de fórmula, es
    // ausencia de validación de rangos razonables (ya documentado, no se arregla acá).
    const ing = { nombre: "Manteca", unidad: "kg", precio: 12000 };
    const item = { unidad: "kg", cantidad: 1320 };
    const r = costoLinea(item, ing);
    expect(r.costo).toBe(1320 * 12000);
  });

  it("litro a ml calcula bien", () => {
    const ing = { nombre: "Leche", unidad: "litro", precio: 1600 };
    const item = { unidad: "ml", cantidad: 250 };
    expect(costoLinea(item, ing).costo).toBe(400);
  });

  it("docena a unidad calcula bien", () => {
    const ing = { nombre: "Huevos", unidad: "docena", precio: 4500 };
    const item = { unidad: "unidad", cantidad: 3 };
    expect(costoLinea(item, ing).costo).toBe(1125);
  });

  it("ingrediente sin precio devuelve error, no NaN ni 0 silencioso", () => {
    const ing = { nombre: "Vino", unidad: "litro", precio: null };
    const r = costoLinea({ unidad: "litro", cantidad: 1 }, ing);
    expect(r.costo).toBeNull();
    expect(r.error).toContain("Vino");
  });

  it("unidades de grupos incompatibles (kg vs litro) da error, no un número inventado", () => {
    const ing = { nombre: "Aceite", unidad: "litro", precio: 2500 };
    const r = costoLinea({ unidad: "kg", cantidad: 1 }, ing);
    expect(r.costo).toBeNull();
    expect(r.error).not.toBeNull();
  });

  it("cantidad negativa o cero se rechaza", () => {
    const ing = { nombre: "Sal", unidad: "kg", precio: 700 };
    expect(costoLinea({ unidad: "kg", cantidad: 0 }, ing).costo).toBeNull();
    expect(costoLinea({ unidad: "kg", cantidad: -5 }, ing).costo).toBeNull();
  });

  it("ingrediente que ya no existe (borrado) da error prolijo", () => {
    const r = costoLinea({ unidad: "kg", cantidad: 1 }, undefined);
    expect(r.costo).toBeNull();
    expect(r.error).toContain("ya no existe");
  });
});

describe("calcPlato: agregación y porciones", () => {
  it("costo por porción = costo total / porciones (caso simple)", () => {
    const mapIng = { i1: { nombre: "Harina", unidad: "kg", precio: 1000 } };
    const plato = { porciones: 10, items: [{ id: "1", ingId: "i1", unidad: "kg", cantidad: 5 }] };
    const r = calcPlato(plato, mapIng);
    expect(r.costoTotal).toBe(5000);
    expect(r.costoPorcion).toBe(500);
    expect(r.incompleto).toBe(false);
  });

  it("porciones=0 no rompe (usa mínimo 1, no divide por cero)", () => {
    const mapIng = { i1: { nombre: "Harina", unidad: "kg", precio: 1000 } };
    const plato = { porciones: 0, items: [{ id: "1", ingId: "i1", unidad: "kg", cantidad: 1 }] };
    const r = calcPlato(plato, mapIng);
    expect(isFinite(r.costoPorcion)).toBe(true);
    expect(r.costoPorcion).toBe(1000);
  });

  it("un ingrediente con error marca el plato entero como incompleto", () => {
    const mapIng = {
      i1: { nombre: "Harina", unidad: "kg", precio: 1000 },
      i2: { nombre: "Vino", unidad: "litro", precio: null },
    };
    const plato = { porciones: 1, items: [
      { id: "1", ingId: "i1", unidad: "kg", cantidad: 1 },
      { id: "2", ingId: "i2", unidad: "litro", cantidad: 1 },
    ] };
    const r = calcPlato(plato, mapIng);
    expect(r.incompleto).toBe(true);
    expect(r.errores).toHaveLength(1);
  });

  it("receta sin ingredientes da costo 0, no error", () => {
    const r = calcPlato({ porciones: 1, items: [] }, {});
    expect(r.costoTotal).toBe(0);
    expect(r.incompleto).toBe(false);
  });
});

describe("semaforo: umbrales exactos (los bordes son donde se rompen las cosas)", () => {
  it("margen null da \"sin datos\", no rojo falso", () => {
    expect(semaforo(null).nivel).toBe("sin");
  });
  it("exactamente 65% NO es verde (regla es >65, estricto)", () => {
    expect(semaforo(65).nivel).toBe("medio");
  });
  it("65.01% SI es verde", () => {
    expect(semaforo(65.01).nivel).toBe("ok");
  });
  it("exactamente 40% SI es amarillo (regla es >=40)", () => {
    expect(semaforo(40).nivel).toBe("medio");
  });
  it("39.99% es rojo", () => {
    expect(semaforo(39.99).nivel).toBe("riesgo");
  });
  it("margen negativo es rojo (plato perdiendo plata)", () => {
    expect(semaforo(-15).nivel).toBe("riesgo");
  });
});

describe("IVA: neto <-> con IVA", () => {
  it("precio con IVA incluido se desarma bien (21%)", () => {
    const cfg = { iva: 21, preciosIncluyenIVA: true };
    expect(netoDe(1210, cfg)).toBeCloseTo(1000, 1);
  });
  it("precio ya neto se devuelve igual, sin tocar", () => {
    const cfg = { iva: 21, preciosIncluyenIVA: false };
    expect(netoDe(1000, cfg)).toBe(1000);
  });
  it("conIVA es la inversa exacta de netoDe (ida y vuelta no pierde plata)", () => {
    const cfg = { iva: 21, preciosIncluyenIVA: true };
    const original = 1815;
    const neto = netoDe(original, cfg);
    const vuelta = conIVA(neto, cfg);
    expect(vuelta).toBeCloseTo(original, 1);
  });
});

describe("Fórmula de precio sugerido: el error clásico de todo excel gastronómico", () => {
  it("costo / (1-margen) NO es lo mismo que costo * (1+margen), y la diferencia es plata real", () => {
    const costo = 1000;
    const margenObjetivo = 65;
    const precioCorrecto = costo / (1 - margenObjetivo / 100);
    const precioIncorrectoComun = costo * (1 + margenObjetivo / 100);
    expect(precioCorrecto).toBeCloseTo(2857.14, 1);
    expect(Math.abs(precioCorrecto - precioIncorrectoComun)).toBeGreaterThan(1000);
    const margenReal = ((precioCorrecto - costo) / precioCorrecto) * 100;
    expect(margenReal).toBeCloseTo(65, 1);
  });
});

describe("cfMensual: conversión de frecuencia", () => {
  it("gasto trimestral se divide por 3", () => {
    expect(cfMensual({ monto: 300000, frecuencia: "trimestral" })).toBe(100000);
  });
  it("gasto anual se divide por 12", () => {
    expect(cfMensual({ monto: 480000, frecuencia: "anual" })).toBe(40000);
  });
  it("gasto mensual queda igual", () => {
    expect(cfMensual({ monto: 50000, frecuencia: "mensual" })).toBe(50000);
  });
  it("monto vacío/undefined no rompe, da 0", () => {
    expect(cfMensual({ frecuencia: "mensual" })).toBe(0);
  });
});

describe("precioEnFecha: usado en el gráfico de evolución", () => {
  it("sin historial, devuelve el precio actual", () => {
    const ing = { precio: 1000, historial: [] };
    expect(precioEnFecha(ing, "2026-09-01")).toBe(1000);
  });
  it("busca el precio vigente en esa fecha (no el más nuevo)", () => {
    const ing = { precio: 1200, historial: [
      { fecha: "2026-01-01", precio: 800 },
      { fecha: "2026-06-01", precio: 1000 },
      { fecha: "2026-09-01", precio: 1200 },
    ] };
    expect(precioEnFecha(ing, "2026-07-15")).toBe(1000);
  });
  it("fecha anterior a todo el historial usa el primer precio conocido", () => {
    const ing = { precio: 1200, historial: [{ fecha: "2026-06-01", precio: 1000 }] };
    expect(precioEnFecha(ing, "2020-01-01")).toBe(1000);
  });
});
