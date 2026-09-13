import { describe, it, expect, beforeEach, vi } from "vitest";
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import App from "../../src/App.jsx";

// E2E del flujo de negocio más importante de la app: una venta registrada en
// la pestaña Ventas tiene que terminar reflejándose en los números de
// Reportería. La conexión real entre ambas pestañas no es directa — pasa por
// "Usar en Pricing" (que convierte ventas reales en unidades estimadas) y de
// ahí a los totales que arma App.jsx (platosCalc → totales → benchmarks/KPIs).
// Este test cubre esa cadena completa, no cada paso por separado.
vi.mock("../../src/services/datos.js", () => ({
  cargarTodo: vi.fn(),
  crearIngrediente: vi.fn().mockResolvedValue(),
  actualizarIngrediente: vi.fn().mockResolvedValue(),
  borrarIngrediente: vi.fn().mockResolvedValue(),
  aplicarPreciosMasivo: vi.fn().mockResolvedValue(),
  crearPlato: vi.fn().mockResolvedValue(),
  actualizarPlato: vi.fn().mockResolvedValue(),
  borrarPlato: vi.fn().mockResolvedValue(),
  actualizarUnidadesEstimadas: vi.fn().mockResolvedValue(),
  actualizarUnidadesMasivo: vi.fn().mockResolvedValue(),
  aplicarPreciosPlatosMasivo: vi.fn().mockResolvedValue(),
  crearCostoFijo: vi.fn().mockResolvedValue(),
  actualizarCostoFijo: vi.fn().mockResolvedValue(),
  borrarCostoFijo: vi.fn().mockResolvedValue(),
  registrarPedido: vi.fn().mockResolvedValue(),
  borrarPedido: vi.fn().mockResolvedValue("correccion-1"),
  deshacerBorradoPedido: vi.fn().mockResolvedValue(),
  agregarCategoria: vi.fn().mockResolvedValue(),
  actualizarBenchmark: vi.fn().mockResolvedValue(),
  actualizarConfiguracion: vi.fn().mockResolvedValue(),
}));

import * as db from "../../src/services/datos.js";

// Arranca SIN ventas y con unidades estimadas en 0 — así el "antes" de
// Reportería queda en "sin datos", y podemos verificar que después de la
// venta pasa a tener números de verdad.
function datasetSinVentas() {
  return {
    ingredientes: [
      { id: "i1", nombre: "Harina", categoria: "Secos", unidad: "kg", precio: 1000, proveedor: "", fechaPrecio: "2026-08-01", historial: [{ fecha: "2026-08-01", precio: 1000 }] },
    ],
    platos: [
      { id: "p1", nombre: "Torta", categoria: "Postres", descripcion: "", foto: "", porciones: 1, tiempo: 0, notas: "", precioVenta: 5000, items: [{ id: "pi1", ingId: "i1", cantidad: 1, unidad: "kg" }] },
    ],
    costosFijos: [],
    ventas: [],
    correccionesVentas: [],
    config: {
      margenObjetivo: 65, iva: 21, preciosIncluyenIVA: true, modoProrrateo: "unidades",
      horasPorDia: 10, diasPorMes: 30, ayudaColapsada: {}, novedadesVistas: [],
      categoriasIngredientes: ["Secos"], categoriasPlatos: ["Postres"], categoriasCostos: ["Otros"],
      unidades: { p1: 0 }, // nadie estimó ventas todavía
      benchmarks: [{ id: "b1", nombre: "Margen bruto sobre ventas", min: 60, max: 70, mejorEs: "alto" }],
    },
  };
}

function montar() {
  const contenedor = document.createElement("div");
  document.body.appendChild(contenedor);
  const root = createRoot(contenedor);
  act(() => { root.render(<App usuarioActual="Juani" usuarioId="u1" companyId="c1" onCerrarSesion={vi.fn()} />); });
  return contenedor;
}
function setVal(input, valor) {
  const proto = input.tagName === "SELECT" ? window.HTMLSelectElement.prototype : window.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value").set;
  act(() => {
    setter.call(input, valor);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
}
function click(el, texto) {
  const btn = [...el.querySelectorAll("button")].find((b) => b.textContent.trim().includes(texto));
  if (!btn) throw new Error(`No se encontró el botón "${texto}". Texto actual: ${el.textContent.slice(0, 300)}`);
  act(() => btn.dispatchEvent(new MouseEvent("click", { bubbles: true })));
  return true;
}
async function esperar(ms = 10) {
  await act(async () => { await new Promise((r) => setTimeout(r, ms)); });
}

describe("E2E — una venta registrada termina impactando los números de Reportería", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.cargarTodo.mockResolvedValue(datasetSinVentas());
  });

  it("antes de vender nada, Reportería muestra 'sin datos'", async () => {
    const el = montar();
    await esperar();
    click(el, "Reportería");
    await esperar();
    expect(el.textContent).toContain("Margen bruto promedio");
    expect(el.textContent).toContain("—"); // sin ventas todavía, margen promedio es null
    expect(el.textContent).toContain("0 porciones/mes estimadas");
  });

  it("vender → usar esa venta en Pricing → Reportería refleja la venta real", async () => {
    const el = montar();
    await esperar();

    // 1) Registrar una venta real en la pestaña Ventas
    click(el, "Ventas");
    await esperar();
    const selectPlato = [...el.querySelectorAll("select")].find((s) => [...s.options].some((o) => o.value === "__nuevo__"));
    setVal(selectPlato, "p1");
    const inputCantidad = [...el.querySelectorAll('input[type="number"]')].find((i) => Number(i.value) === 1);
    if (inputCantidad) setVal(inputCantidad, "2");
    click(el, "Agregar al pedido");
    await act(async () => { click(el, "Confirmar venta"); await esperar(); });
    expect(db.registrarPedido).toHaveBeenCalled();
    expect(el.textContent).toContain("Venta registrada");

    // 2) Convertir esa venta real en la estimación de unidades de Pricing
    await act(async () => { click(el, "Usar en Pricing"); await esperar(); });
    expect(db.actualizarUnidadesMasivo).toHaveBeenCalledWith([{ platoId: "p1", unidades: expect.any(Number) }]);
    const [cambios] = db.actualizarUnidadesMasivo.mock.calls[0];
    expect(cambios[0].unidades).toBeGreaterThan(0);

    // 3) Ir a Reportería y confirmar que los KPIs ya no dicen "sin datos"
    click(el, "Reportería");
    await esperar();
    expect(el.textContent).toContain("60 porciones/mes estimadas"); // 2 unidades vendidas × factor de estimación (30 días / 1 día con datos)
    expect(el.textContent).not.toContain("Margen bruto promedio—"); // ya no es el placeholder inicial
    expect(el.textContent).toMatch(/Margen bruto promedio\d+,\d%/); // ahora es un número real
  });
});
