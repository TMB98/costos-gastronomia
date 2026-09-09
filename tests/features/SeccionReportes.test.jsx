import { describe, it, expect } from "vitest";
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { semaforo } from "../../src/lib/calculos.js";
import SeccionReportes from "../../src/features/reportes/SeccionReportes.jsx";

function montar(elemento) {
  const contenedor = document.createElement("div");
  document.body.appendChild(contenedor);
  const root = createRoot(contenedor);
  act(() => { root.render(elemento); });
  return contenedor;
}

// Platos ya "calculados" (como los entregaría App() vía calcPlato+netoDe+semaforo),
// armados a mano con márgenes conocidos para poder verificar el conteo del semáforo.
const PLATOS_CALC = [
  { id: "p1", nombre: "Verde", margen: 70, neto: 3000, precioVenta: 3630, costoPorcion: 900, incompleto: false, porciones: 1, unidades: 50, detalle: [], sem: semaforo(70) },
  { id: "p2", nombre: "Amarillo", margen: 50, neto: 2000, precioVenta: 2420, costoPorcion: 1000, incompleto: false, porciones: 1, unidades: 30, detalle: [], sem: semaforo(50) },
  { id: "p3", nombre: "Rojo", margen: 20, neto: 1000, precioVenta: 1210, costoPorcion: 800, incompleto: false, porciones: 1, unidades: 20, detalle: [], sem: semaforo(20) },
];

const CFG = { margenObjetivo: 65, iva: 21, preciosIncluyenIVA: false, benchmarks: [
  { id: "b1", nombre: "Margen bruto", min: 60, max: 70, mejorEs: "alto" },
] };
const DATA = { ingredientes: [], costosFijos: [] };
const cfPorPorcion = () => 200;

function propsBase(overrides = {}) {
  return {
    data: DATA,
    cfg: CFG,
    setCfg: () => {},
    platosCalc: PLATOS_CALC,
    totalCF: 50000,
    totales: { ingresos: 300000, costoIng: 90000, unidadesTot: 100 },
    cfPorPorcion,
    setData: () => {},
    mapIng: {},
    ...overrides,
  };
}

describe("SeccionReportes — panel 1 (siempre visible)", () => {
  it("cuenta correctamente los platos verdes/amarillos/rojos según su margen", () => {
    const el = montar(<SeccionReportes {...propsBase()} />);
    // Verde: margen>65 (1 plato con 70%); Amarillo: 40<=margen<=65 (1 con 50%); Rojo: margen<40 (1 con 20%)
    expect(el.textContent).toContain("🟢 1");
    expect(el.textContent).toContain("🟡 1");
    expect(el.textContent).toContain("🔴 1");
  });

  it("calcula el resultado antes de impuestos = ingresos - costoIng - totalCF", () => {
    // 300000 - 90000 - 50000 = 160000
    const el = montar(<SeccionReportes {...propsBase()} />);
    expect(el.textContent).toContain("Resultado antes de impuestos");
    expect(el.textContent).toContain("$160.000");
  });

  it("resultado negativo se muestra igual (no se oculta ni se fuerza a positivo)", () => {
    const el = montar(<SeccionReportes {...propsBase({ totales: { ingresos: 10000, costoIng: 5000, unidadesTot: 10 }, totalCF: 50000 })} />);
    // 10000 - 5000 - 50000 = -45000
    expect(el.textContent).toContain("$-45.000");
  });

  it("el margen bruto promedio se calcula sobre ingresos y costo de ingredientes totales", () => {
    // (300000 - 90000) / 300000 = 70%
    const el = montar(<SeccionReportes {...propsBase()} />);
    expect(el.textContent).toContain("70,0%");
  });

  it("muestra la cantidad total de platos en el menú", () => {
    const el = montar(<SeccionReportes {...propsBase()} />);
    expect(el.textContent).toContain("Platos en el menú");
    const kpiPlatos = [...el.querySelectorAll("p")].find((p) => p.textContent.trim() === "Platos en el menú");
    expect(kpiPlatos.nextElementSibling.textContent).toBe("3");
  });
});

describe("SeccionReportes — paneles bloqueados", () => {
  it("muestra el aviso de \"Próximamente disponible\"", () => {
    const el = montar(<SeccionReportes {...propsBase()} />);
    expect(el.textContent).toContain("Próximamente disponible");
  });

  it("los paneles 2-6 igual están en el DOM (aunque bloqueados), con datos reales calculados", () => {
    const el = montar(<SeccionReportes {...propsBase()} />);
    expect(el.textContent).toContain("Ranking de platos por rentabilidad");
    expect(el.textContent).toContain("Comparativa con el mercado gastronómico argentino");
    expect(el.textContent).toContain("Evolución del costo de la carta");
  });

  it("sin problemas de margen, el panel 3 muestra el mensaje de \"toda la carta sana\"", () => {
    const todosVerdes = PLATOS_CALC.map((p) => ({ ...p, margen: 70, neto: 3000, costoPorcion: 500, sem: semaforo(70) }));
    const el = montar(<SeccionReportes {...propsBase({ platosCalc: todosVerdes })} />);
    expect(el.textContent).toContain("Toda la carta está en zona sana");
  });

  it("un plato con margen bajo aparece en la tabla de \"platos con poco margen\"", () => {
    const el = montar(<SeccionReportes {...propsBase()} />); // "Rojo" tiene margen 20%, debería aparecer
    expect(el.textContent).toContain("Rojo");
  });
});
