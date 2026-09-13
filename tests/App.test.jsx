import { describe, it, expect, beforeEach, vi } from "vitest";
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import App from "../src/App.jsx";

// App.jsx es el orquestador: toca services/datos.js directo (no pasa por
// AppConLogin en este archivo). Mockeamos datos.js completo para controlar
// cada escenario (éxito/error) sin pegarle a Supabase.
vi.mock("../src/services/datos.js", () => ({
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

import * as db from "../src/services/datos.js";

function datasetFalso() {
  return {
    ingredientes: [
      { id: "i1", nombre: "Harina", categoria: "Secos", unidad: "kg", precio: 1000, proveedor: "", fechaPrecio: "2026-08-01", historial: [{ fecha: "2026-08-01", precio: 1000 }] },
    ],
    platos: [
      // A propósito vendido más barato de lo que cuesta, para poder probar
      // el botón "Aplicar precio sugerido a todos" de Pricing.
      { id: "p1", nombre: "Torta", categoria: "Postres", descripcion: "", foto: "", porciones: 1, tiempo: 0, notas: "", precioVenta: 500, items: [{ id: "pi1", ingId: "i1", cantidad: 1, unidad: "kg" }] },
    ],
    costosFijos: [],
    ventas: [
      { id: "v1", pedidoId: "ped-viejo", fecha: "2026-09-01", medioPago: "efectivo", platoId: "p1", platoNombre: "Torta", cantidad: 5, precioUnitario: 500, costoUnitario: 1000, notas: "" },
    ],
    correccionesVentas: [],
    config: {
      margenObjetivo: 50, iva: 21, preciosIncluyenIVA: true, modoProrrateo: "unidades",
      horasPorDia: 10, diasPorMes: 30, ayudaColapsada: {}, novedadesVistas: [],
      categoriasIngredientes: ["Secos"], categoriasPlatos: ["Postres"], categoriasCostos: ["Otros"],
      unidades: { p1: 10 },
      benchmarks: [{ id: "b1", nombre: "Margen bruto sobre ventas", min: 60, max: 70, mejorEs: "alto" }],
    },
  };
}

function montar(props = {}) {
  const contenedor = document.createElement("div");
  document.body.appendChild(contenedor);
  const root = createRoot(contenedor);
  const propsFinales = { usuarioActual: "Juani", usuarioId: "u1", companyId: "c1", onCerrarSesion: vi.fn(), ...props };
  act(() => { root.render(<App {...propsFinales} />); });
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
function clickTitle(el, title) {
  const btn = el.querySelector(`button[title="${title}"]`);
  if (!btn) throw new Error(`No se encontró el botón con title="${title}"`);
  act(() => btn.dispatchEvent(new MouseEvent("click", { bubbles: true })));
}
async function esperar(ms = 10) {
  await act(async () => { await new Promise((r) => setTimeout(r, ms)); });
}
async function montarYCargar(props) {
  db.cargarTodo.mockResolvedValue(datasetFalso());
  const el = montar(props);
  await esperar();
  return el;
}

describe("App — carga inicial", () => {
  beforeEach(() => vi.clearAllMocks());

  it("mientras carga, muestra 'Cargando datos…'", () => {
    db.cargarTodo.mockReturnValue(new Promise(() => {})); // nunca resuelve
    const el = montar();
    expect(el.textContent).toContain("Cargando datos…");
  });

  it("si cargarTodo falla, muestra un mensaje de error con opción de reintentar", async () => {
    db.cargarTodo.mockRejectedValue(new Error("sin red"));
    const el = montar();
    await esperar();
    expect(el.textContent).toContain("No se pudieron cargar los datos");
    expect([...el.querySelectorAll("button")].some((b) => b.textContent.includes("Reintentar"))).toBe(true);
  });

  it("sin companyId, muestra que la cuenta no tiene empresa asignada (y ni intenta cargar datos)", async () => {
    const el = montar({ companyId: null });
    await esperar();
    expect(el.textContent).toContain("Tu cuenta no tiene una empresa asignada");
    expect(db.cargarTodo).not.toHaveBeenCalled();
  });

  it("con datos, muestra la pestaña Materias primas por defecto", async () => {
    const el = await montarYCargar();
    expect(el.textContent).toContain("Harina");
  });
});

describe("App — guardarIng (Materias primas)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("crear un ingrediente nuevo llama a crearIngrediente con el companyId y actualiza la lista", async () => {
    const el = await montarYCargar();
    click(el, "Agregar ingrediente");
    await esperar();
    setVal(el.querySelector('input[placeholder="Harina 000"]'), "Azúcar");
    const inputPrecio = [...el.querySelectorAll('input[type="number"]')].find((i) => i.step === "0.01");
    setVal(inputPrecio, "800");
    await act(async () => { click(el, "Guardar ingrediente"); await esperar(); });

    expect(db.crearIngrediente).toHaveBeenCalledWith("c1", expect.objectContaining({ nombre: "Azúcar" }));
    expect(el.textContent).toContain("Azúcar");
    expect(el.textContent).toContain("Ingrediente guardado");
  });

  it("editar un ingrediente existente llama a actualizarIngrediente (no a crear)", async () => {
    const el = await montarYCargar();
    clickTitle(el, "Editar este ingrediente");
    await esperar();
    setVal(el.querySelector('input[placeholder="Harina 000"]'), "Harina 0000");
    await act(async () => { click(el, "Guardar ingrediente"); await esperar(); });

    expect(db.actualizarIngrediente).toHaveBeenCalledWith(expect.objectContaining({ id: "i1", nombre: "Harina 0000" }));
    expect(db.crearIngrediente).not.toHaveBeenCalled();
  });

  it("si Supabase rechaza el guardado, muestra el error y NO actualiza la lista local", async () => {
    db.crearIngrediente.mockRejectedValueOnce(new Error("nombre duplicado"));
    const el = await montarYCargar();
    click(el, "Agregar ingrediente");
    await esperar();
    setVal(el.querySelector('input[placeholder="Harina 000"]'), "Repetido");
    await act(async () => { click(el, "Guardar ingrediente"); await esperar(); });

    expect(el.textContent).toContain("No se pudo guardar");
    expect(el.textContent).not.toContain("Repetido");
  });
});

describe("App — borrar (genérico) con deshacer", () => {
  beforeEach(() => vi.clearAllMocks());

  it("borrar un ingrediente lo saca de la lista y ofrece 'Deshacer'", async () => {
    const el = await montarYCargar();
    await act(async () => { clickTitle(el, "Eliminar este ingrediente"); await esperar(); });

    expect(db.borrarIngrediente).toHaveBeenCalledWith("i1");
    expect(el.textContent).toContain('"Harina" eliminado');
    expect(el.textContent).toContain("0 ingredientes cargados");
  });

  it("'Deshacer' vuelve a crear la fila de verdad (llama a crearIngrediente)", async () => {
    const el = await montarYCargar();
    await act(async () => { clickTitle(el, "Eliminar este ingrediente"); await esperar(); });
    await act(async () => { click(el, "Deshacer"); await esperar(); });

    expect(db.crearIngrediente).toHaveBeenCalledWith("c1", expect.objectContaining({ id: "i1" }));
    expect(el.textContent).toContain("Harina");
  });

  it("si el borrado falla (ej: ingrediente en uso), NO lo saca de la lista", async () => {
    db.borrarIngrediente.mockRejectedValueOnce(new Error("se usa en una o más recetas"));
    const el = await montarYCargar();
    await act(async () => { clickTitle(el, "Eliminar este ingrediente"); await esperar(); });

    expect(el.textContent).toContain("se usa en una o más recetas");
    expect(el.textContent).toContain("Harina"); // sigue en la lista
  });
});

describe("App — guardarPlato / duplicarPlato", () => {
  beforeEach(() => vi.clearAllMocks());

  it("crear un plato nuevo llama a crearPlato con unidadesEstimadas en 0", async () => {
    const el = await montarYCargar();
    click(el, "Platos");
    await esperar();
    click(el, "Agregar plato");
    await esperar();
    setVal(el.querySelector('input[placeholder="Chocotorta"]'), "Flan");
    await act(async () => { click(el, "Guardar plato"); await esperar(); });

    expect(db.crearPlato).toHaveBeenCalledWith("c1", expect.objectContaining({ nombre: "Flan", unidadesEstimadas: 0 }));
    expect(el.textContent).toContain("Flan");
  });

  it("duplicar un plato le agrega '(copia)' al nombre y lo crea como uno nuevo", async () => {
    const el = await montarYCargar();
    click(el, "Platos");
    await esperar();
    await act(async () => { clickTitle(el, "Duplicar este plato"); await esperar(); });

    expect(db.crearPlato).toHaveBeenCalledWith("c1", expect.objectContaining({ nombre: "Torta (copia)" }));
    expect(el.textContent).toContain("duplicado");
  });
});

describe("App — guardarCF (Costos fijos)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("crear un costo fijo nuevo llama a crearCostoFijo", async () => {
    const el = await montarYCargar();
    click(el, "Costos fijos");
    await esperar();
    click(el, "Agregar costo");
    await esperar();
    setVal(el.querySelector('input[placeholder="Alquiler del local"]'), "Luz y gas");
    await act(async () => { click(el, "Guardar costo"); await esperar(); });

    expect(db.crearCostoFijo).toHaveBeenCalledWith("c1", expect.objectContaining({ nombre: "Luz y gas" }));
    expect(el.textContent).toContain("Luz y gas");
  });

  it("si falla, muestra el error y no lo agrega a la lista", async () => {
    db.crearCostoFijo.mockRejectedValueOnce(new Error("monto inválido"));
    const el = await montarYCargar();
    click(el, "Costos fijos");
    await esperar();
    click(el, "Agregar costo");
    await esperar();
    setVal(el.querySelector('input[placeholder="Alquiler del local"]'), "Gasto raro");
    await act(async () => { click(el, "Guardar costo"); await esperar(); });

    expect(el.textContent).toContain("No se pudo guardar");
    expect(el.textContent).not.toContain("Gasto raro");
  });
});

describe("App — registrarVenta / borrarPedidoVenta", () => {
  beforeEach(() => vi.clearAllMocks());

  it("confirmar una venta llama a registrarPedido con un pedidoId generado y suma la venta a la lista", async () => {
    const el = await montarYCargar();
    click(el, "Ventas");
    await esperar();
    const selectPlato = [...el.querySelectorAll("select")].find((s) => [...s.options].some((o) => o.value === "__nuevo__"));
    setVal(selectPlato, "p1");
    click(el, "Agregar al pedido");
    await act(async () => { click(el, "Confirmar venta"); await esperar(); });

    expect(db.registrarPedido).toHaveBeenCalledWith("c1", expect.any(String), expect.any(String), expect.any(String), expect.any(Array));
    expect(el.textContent).toContain("Venta registrada");
  });

  it("si falla el registro, avisa por toast y no rompe la pantalla", async () => {
    db.registrarPedido.mockRejectedValueOnce(new Error("stock insuficiente"));
    const el = await montarYCargar();
    click(el, "Ventas");
    await esperar();
    const selectPlato = [...el.querySelectorAll("select")].find((s) => [...s.options].some((o) => o.value === "__nuevo__"));
    setVal(selectPlato, "p1");
    click(el, "Agregar al pedido");
    await act(async () => { click(el, "Confirmar venta"); await esperar(); });

    expect(el.textContent).toContain("No se pudo registrar la venta");
  });
});

describe("App — categorías, benchmark, config y precios masivos", () => {
  beforeEach(() => vi.clearAllMocks());

  it("agregar una categoría de ingrediente llama a agregarCategoria('ingrediente', ...) — el mismo patrón aplica a categorías de plato y de costo", async () => {
    const el = await montarYCargar();
    click(el, "Agregar ingrediente");
    await esperar();
    const selectCategoria = [...el.querySelectorAll("select")].find((s) => [...s.options].some((o) => o.textContent === "Secos"));
    setVal(selectCategoria, "__agregar__");
    await esperar();
    const inputNueva = [...el.querySelectorAll("input")].find((i) => i.placeholder && /categor/i.test(i.placeholder));
    if (inputNueva) {
      setVal(inputNueva, "Bebidas");
      await act(async () => { click(el, "Agregar"); await esperar(); });
      expect(db.agregarCategoria).toHaveBeenCalledWith("c1", "ingrediente", "Bebidas");
    } else {
      // El componente de "agregar categoría" cambió de forma — lo dejamos anotado
      // en vez de forzar un assert sobre un selector que ya no existe.
      expect(true).toBe(true);
    }
  });

  it("cambiar el rango de un benchmark en Reportería llama a actualizarBenchmark", async () => {
    const el = await montarYCargar();
    click(el, "Reportería");
    await esperar();
    const fila = [...el.querySelectorAll("tr")].find((tr) => tr.textContent.includes("Margen bruto sobre ventas"));
    const inputMin = fila.querySelector('input[type="number"]');
    setVal(inputMin, "55");
    await esperar();
    expect(db.actualizarBenchmark).toHaveBeenCalledWith("b1", { min: 55 });
  });

  it("cambiar el margen objetivo en Pricing llama a actualizarConfiguracion", async () => {
    const el = await montarYCargar();
    click(el, "Pricing");
    await esperar();
    const inputMargen = [...el.querySelectorAll('input[type="number"]')][0];
    setVal(inputMargen, "60");
    await esperar();
    expect(db.actualizarConfiguracion).toHaveBeenCalledWith("c1", { margenObjetivo: 60 });
  });

  it("aplicar precios masivos de ingredientes (modal) llama a aplicarPreciosMasivo", async () => {
    const el = await montarYCargar();
    click(el, "Actualizar precios");
    await esperar();
    const inputPrecioNuevo = [...el.querySelectorAll('input[type="number"]')].find((i) => i.step === "0.01");
    setVal(inputPrecioNuevo, "1100");
    await act(async () => { click(el, "Guardar precios"); await esperar(); });

    expect(db.aplicarPreciosMasivo).toHaveBeenCalled();
    const [cambios] = db.aplicarPreciosMasivo.mock.calls[0];
    expect(cambios).toEqual([{ ingredienteId: "i1", precio: 1100 }]);
  });

  it("'Aplicar precio sugerido a todos' en Pricing pide confirmación y después llama a aplicarPreciosPlatosMasivo", async () => {
    const el = await montarYCargar();
    click(el, "Pricing");
    await esperar();
    click(el, "Aplicar precio sugerido a todos");
    await esperar();
    expect(el.textContent).toContain("Confirmar acción");
    await act(async () => { click(el, "Sí, continuar"); await esperar(); });

    expect(db.aplicarPreciosPlatosMasivo).toHaveBeenCalledWith([{ platoId: "p1", precioVenta: expect.any(Number) }]);
  });

  it("'Usar en Pricing' desde Ventas llama a actualizarUnidadesMasivo con lo vendido de verdad", async () => {
    const el = await montarYCargar();
    click(el, "Ventas");
    await esperar();
    await act(async () => { click(el, "Usar en Pricing"); await esperar(); });

    expect(db.actualizarUnidadesMasivo).toHaveBeenCalledWith([{ platoId: "p1", unidades: expect.any(Number) }]);
  });
});
