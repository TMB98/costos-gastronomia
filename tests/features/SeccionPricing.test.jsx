import { describe, it, expect, vi } from "vitest";
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { RolContext } from "../../src/auth/usuarios.js";
import { calcPlato, netoDe, semaforo } from "../../src/lib/calculos.js";
import SeccionPricing from "../../src/features/pricing/SeccionPricing.jsx";

function montar(elemento, rol = "admin") {
  const contenedor = document.createElement("div");
  document.body.appendChild(contenedor);
  const root = createRoot(contenedor);
  act(() => { root.render(<RolContext.Provider value={rol}>{elemento}</RolContext.Provider>); });
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
  act(() => btn.dispatchEvent(new MouseEvent("click", { bubbles: true })));
}

const CFG_BASE = { iva: 21, preciosIncluyenIVA: false, margenObjetivo: 65, modoProrrateo: "unidades", unidades: { p1: 50, p2: 50 } };
const MAP_ING = { i1: { id: "i1", nombre: "Harina", unidad: "kg", precio: 1000 } };

function construirPlatoCalc(plato, cfg) {
  const calc = calcPlato(plato, MAP_ING);
  const neto = netoDe(plato.precioVenta, cfg);
  const margen = neto > 0 && !calc.incompleto ? ((neto - calc.costoPorcion) / neto) * 100 : null;
  const sem = semaforo(calc.incompleto ? null : margen);
  return { ...plato, ...calc, neto, margen, sem };
}

// Plato bien pricied: costo ingredientes $1000/porción, con $500 de costos fijos = $1500 real.
// Al 65% de margen, el precio sugerido neto = 1500 / 0.35 = 4285,71. Cargamos un precio de venta
// bien por encima de eso para que dé "cobrando de más" o "zona ok" según el caso.
const PLATO_OK = construirPlatoCalc(
  { id: "p1", nombre: "Torta", categoria: "Postre", porciones: 1, precioVenta: 4300, items: [{ id: "l1", ingId: "i1", cantidad: 1, unidad: "kg" }] },
  CFG_BASE
);
// Plato perdiendo plata: precio de venta MUY bajo, por debajo del costo real.
const PLATO_PERDIENDO = construirPlatoCalc(
  { id: "p2", nombre: "Flan", categoria: "Postre", porciones: 1, precioVenta: 500, items: [{ id: "l2", ingId: "i1", cantidad: 1, unidad: "kg" }] },
  CFG_BASE
);

// cfPorPorcion simulado: $500 fijo por porción para cualquier plato (simplifica el test,
// ya que el prorrateo real lo calcula App() aparte y acá solo se consume).
const cfPorPorcion = () => 500;
const totales = { unidadesTot: 100, ingresos: 480000, costoIng: 100000 };

function propsBase(overrides = {}) {
  return {
    data: { platos: [] },
    cfg: CFG_BASE,
    platosCalc: [PLATO_OK],
    totalCF: 50000,
    totales,
    cfPorPorcion,
    prorrateoSinDatos: false,
    setCfg: vi.fn(),
    setData: vi.fn(),
    toast: vi.fn(),
    setConfirmar: vi.fn(),
    ...overrides,
  };
}

describe("SeccionPricing — calculadora de precio sugerido", () => {
  it("muestra el costo de ingredientes, el costo fijo asignado, y el costo real sumado", () => {
    const el = montar(<SeccionPricing {...propsBase()} />);
    expect(el.textContent).toContain("$1.000,00"); // costo ingredientes (1kg harina a $1000)
    expect(el.textContent).toContain("$500,00"); // cfPorPorcion simulado
    expect(el.textContent).toContain("$1.500,00"); // costo real = 1000 + 500
  });

  it("el precio sugerido usa la fórmula costo/(1-margen), NO costo*(1+margen)", () => {
    const el = montar(<SeccionPricing {...propsBase()} />);
    // real=1500, margen=65% -> sugerido neto = 1500/0.35 = 4285.714... redondeado a $4.285,71
    expect(el.textContent).toContain("$4.285,71");
    // La fórmula incorrecta común (costo * 1.65 = 2475) NO debería aparecer como sugerido
    expect(el.textContent).not.toContain("$2.475,00");
  });

  it("cambiar el plato seleccionado en la calculadora muestra sus propios números", () => {
    const el = montar(<SeccionPricing {...propsBase({ platosCalc: [PLATO_OK, PLATO_PERDIENDO] })} />);
    const selectCalculadora = [...el.querySelectorAll("select")].find((s) => [...s.options].some((o) => o.value === "p2"));
    setVal(selectCalculadora, "p2");
    expect(el.textContent).toContain("Estás perdiendo plata");
  });
});

describe("SeccionPricing — veredictos", () => {
  it("un plato con precio muy por debajo del costo real dice \"Estás perdiendo plata\"", () => {
    const el = montar(<SeccionPricing {...propsBase({ platosCalc: [PLATO_PERDIENDO] })} />);
    expect(el.textContent).toContain("Estás perdiendo plata");
  });

  it("un plato bien pricied (por encima del sugerido) dice \"cobrando de más\" o \"zona ok\"", () => {
    const el = montar(<SeccionPricing {...propsBase({ platosCalc: [PLATO_OK] })} />);
    const dice = el.textContent.includes("Estás cobrando de más") || el.textContent.includes("Estás en zona ok");
    expect(dice).toBe(true);
  });
});

describe("SeccionPricing — cartel y acción masiva de platos perdiendo plata", () => {
  it("con un plato perdiendo plata, aparece el cartel y el botón (admin)", () => {
    const el = montar(<SeccionPricing {...propsBase({ platosCalc: [PLATO_OK, PLATO_PERDIENDO] })} />, "admin");
    expect(el.textContent).toContain("perdiendo plata");
    expect(el.textContent).toContain("Aplicar precio sugerido a todos");
  });

  it("sin platos perdiendo plata, el cartel no aparece", () => {
    const el = montar(<SeccionPricing {...propsBase({ platosCalc: [PLATO_OK] })} />, "admin");
    expect(el.textContent).not.toContain("Aplicar precio sugerido a todos");
  });

  it("clickear \"Aplicar precio sugerido a todos\" pide confirmación con setConfirmar, no aplica directo", () => {
    const setConfirmar = vi.fn();
    const setData = vi.fn();
    const el = montar(<SeccionPricing {...propsBase({ platosCalc: [PLATO_OK, PLATO_PERDIENDO], setConfirmar, setData })} />, "admin");
    click(el, "Aplicar precio sugerido a todos");
    expect(setConfirmar).toHaveBeenCalledTimes(1);
    expect(setData).not.toHaveBeenCalled(); // todavía no se aplicó, falta confirmar
    const { accion } = setConfirmar.mock.calls[0][0];
    expect(typeof accion).toBe("function");
  });

  it("VISUALIZADOR no ve el cartel de platos perdiendo plata aunque existan", () => {
    const el = montar(<SeccionPricing {...propsBase({ platosCalc: [PLATO_OK, PLATO_PERDIENDO] })} />, "visualizador");
    expect(el.textContent).not.toContain("Aplicar precio sugerido a todos");
  });
});

describe("SeccionPricing — aviso de prorrateo sin datos", () => {
  it("cuando prorrateoSinDatos=true, muestra el aviso amarillo explicando el $0", () => {
    const el = montar(<SeccionPricing {...propsBase({ prorrateoSinDatos: true })} />);
    expect(el.textContent).toContain("Todavía no cargaste");
    expect(el.textContent).toContain("no es que no tengas costos que cubrir");
  });

  it("cuando prorrateoSinDatos=false, no aparece el aviso", () => {
    const el = montar(<SeccionPricing {...propsBase({ prorrateoSinDatos: false })} />);
    expect(el.textContent).not.toContain("Todavía no cargaste");
  });
});

describe("SeccionPricing — gateo por rol en los inputs de configuración", () => {
  it("ADMIN: los inputs de margen/IVA/preciosIncluyenIVA están habilitados", () => {
    const el = montar(<SeccionPricing {...propsBase()} />, "admin");
    const inputMargen = [...el.querySelectorAll('input[type="number"]')].find((i) => i.max === "95");
    expect(inputMargen.disabled).toBe(false);
  });

  it("VISUALIZADOR: los inputs de configuración están deshabilitados", () => {
    const el = montar(<SeccionPricing {...propsBase()} />, "visualizador");
    const inputMargen = [...el.querySelectorAll('input[type="number"]')].find((i) => i.max === "95");
    expect(inputMargen.disabled).toBe(true);
  });

  it("CAJERO: tampoco puede tocar la configuración de Pricing", () => {
    const el = montar(<SeccionPricing {...propsBase()} />, "cajero");
    const inputMargen = [...el.querySelectorAll('input[type="number"]')].find((i) => i.max === "95");
    expect(inputMargen.disabled).toBe(true);
  });

  it("cambiar el margen objetivo llama a setCfg con el valor numérico", () => {
    const setCfg = vi.fn();
    const el = montar(<SeccionPricing {...propsBase({ setCfg })} />, "admin");
    const inputMargen = [...el.querySelectorAll('input[type="number"]')].find((i) => i.max === "95");
    setVal(inputMargen, "70");
    expect(setCfg).toHaveBeenCalledWith("margenObjetivo", 70);
  });
});

describe("SeccionPricing — resumen de toda la carta", () => {
  it("lista todos los platos con su veredicto en la tabla resumen", () => {
    const el = montar(<SeccionPricing {...propsBase({ platosCalc: [PLATO_OK, PLATO_PERDIENDO] })} />);
    expect(el.textContent).toContain("Resumen de toda la carta");
    expect(el.textContent).toContain("Torta");
    expect(el.textContent).toContain("Flan");
  });
});
