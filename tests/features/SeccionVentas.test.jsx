import { describe, it, expect, vi } from "vitest";
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { RolContext } from "../../src/auth/usuarios.js";
import SeccionVentas from "../../src/features/ventas/SeccionVentas.jsx";

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

const PLATOS_CALC = [
  { id: "p1", nombre: "Chocotorta", precioVenta: 2500, costoPorcion: 1000, incompleto: false },
  { id: "p2", nombre: "Flan", precioVenta: 1800, costoPorcion: 700, incompleto: false },
];

function propsBase(overrides = {}) {
  return {
    data: { ventas: [], correccionesVentas: [] },
    setData: vi.fn(),
    platosCalc: PLATOS_CALC,
    borrar: vi.fn(),
    borrarPedidoVenta: vi.fn(),
    toast: vi.fn(),
    cfg: { unidades: {} },
    setCfg: vi.fn(),
    setModal: vi.fn(),
    platoRecienCreado: null,
    limpiarPlatoRecienCreado: vi.fn(),
    totalCF: 100000,
    ...overrides,
  };
}

describe("SeccionVentas — carrito y confirmación", () => {
  it("agregar un ítem al pedido lo muestra en la tabla del carrito con el subtotal correcto", () => {
    const el = montar(<SeccionVentas {...propsBase()} />);
    const selectPlato = [...el.querySelectorAll("select")].find((s) => [...s.options].some((o) => o.value === "__nuevo__"));
    setVal(selectPlato, "p1");
    const inputCant = el.querySelector('input[min="1"]');
    setVal(inputCant, "3");
    click(el, "Agregar al pedido");
    expect(el.textContent).toContain("Total del pedido");
    expect(el.textContent).toContain("$7.500,00"); // 3 * 2500
  });

  it("agregar el mismo plato dos veces suma la cantidad en vez de duplicar la línea", () => {
    const el = montar(<SeccionVentas {...propsBase()} />);
    const selectPlato = [...el.querySelectorAll("select")].find((s) => [...s.options].some((o) => o.value === "__nuevo__"));
    setVal(selectPlato, "p1");
    click(el, "Agregar al pedido"); // cantidad 1 por defecto
    click(el, "Agregar al pedido"); // otra vez, cantidad 1
    const tablaCarrito = [...el.querySelectorAll("table")].find((t) => t.textContent.includes("Total del pedido"));
    const filas = tablaCarrito.querySelectorAll("tbody tr");
    expect(filas.length).toBe(2); // 1 línea de ítem + 1 fila de total
    expect(tablaCarrito.textContent).toContain("$5.000,00"); // 2 * 2500
  });

  it("con el carrito vacío, el botón \"Confirmar venta\" está deshabilitado", () => {
    const el = montar(<SeccionVentas {...propsBase()} />);
    const btn = [...el.querySelectorAll("button")].find((b) => b.textContent.trim().includes("Confirmar venta"));
    expect(btn.disabled).toBe(true);
  });

  it("confirmar venta guarda todos los ítems con el mismo pedidoId y limpia el carrito", () => {
    const setData = vi.fn();
    const el = montar(<SeccionVentas {...propsBase({ setData })} />);
    const selectPlato = [...el.querySelectorAll("select")].find((s) => [...s.options].some((o) => o.value === "__nuevo__"));
    setVal(selectPlato, "p1");
    click(el, "Agregar al pedido");
    click(el, "Confirmar venta");

    expect(setData).toHaveBeenCalledTimes(1);
    const actualizador = setData.mock.calls[0][0];
    const resultado = actualizador({ ventas: [] });
    expect(resultado.ventas).toHaveLength(1);
    expect(resultado.ventas[0].platoNombre).toBe("Chocotorta");
    expect(resultado.ventas[0].pedidoId).toBeTruthy();

    // El carrito se vació: ya no aparece "Total del pedido"
    expect(el.textContent).not.toContain("Total del pedido");
  });

  it("quitar un ítem del carrito antes de confirmar lo saca de la lista", () => {
    const el = montar(<SeccionVentas {...propsBase()} />);
    const selectPlato = [...el.querySelectorAll("select")].find((s) => [...s.options].some((o) => o.value === "__nuevo__"));
    setVal(selectPlato, "p1");
    click(el, "Agregar al pedido");
    expect(el.textContent).toContain("Chocotorta");
    const btnQuitar = el.querySelector('button[title="Quitar del pedido"]');
    act(() => btnQuitar.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(el.textContent).not.toContain("Total del pedido");
  });
});

describe("SeccionVentas — ganancia real del mes (matemática)", () => {
  it("calcula facturación, costo y ganancia correctamente para ventas de este mes", () => {
    const hoy = new Date();
    const fechaEsteMes = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-05`;
    const ventas = [
      { id: "v1", fecha: fechaEsteMes, cantidad: 2, precioUnitario: 2500, costoUnitario: 1000, medioPago: "efectivo" },
      { id: "v2", fecha: fechaEsteMes, cantidad: 1, precioUnitario: 1800, costoUnitario: 700, medioPago: "tarjeta" },
    ];
    // facturación = 2*2500 + 1*1800 = 6800; costo = 2*1000 + 1*700 = 2700; totalCF = 1000
    // ganancia = 6800 - 2700 - 1000 = 3100
    const el = montar(<SeccionVentas {...propsBase({ data: { ventas, correccionesVentas: [] }, totalCF: 1000 })} />);
    expect(el.textContent).toContain("$6.800"); // facturación
    expect(el.textContent).toContain("$2.700"); // costo
    expect(el.textContent).toContain("Ganancia real de este mes");
    expect(el.textContent).toContain("$3.100");
  });

  it("cuando la ganancia es negativa, muestra \"Pérdida real de este mes\" con el valor absoluto", () => {
    const hoy = new Date();
    const fechaEsteMes = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-05`;
    const ventas = [{ id: "v1", fecha: fechaEsteMes, cantidad: 1, precioUnitario: 1000, costoUnitario: 500, medioPago: "efectivo" }];
    // facturación=1000, costo=500, totalCF=10000 -> ganancia = 1000-500-10000 = -9500
    const el = montar(<SeccionVentas {...propsBase({ data: { ventas, correccionesVentas: [] }, totalCF: 10000 })} />);
    expect(el.textContent).toContain("Pérdida real de este mes");
    expect(el.textContent).toContain("$9.500");
  });

  it("ventas de meses anteriores NO se cuentan en la ganancia de este mes", () => {
    const ventas = [{ id: "v1", fecha: "2020-01-01", cantidad: 10, precioUnitario: 5000, costoUnitario: 100, medioPago: "efectivo" }];
    const el = montar(<SeccionVentas {...propsBase({ data: { ventas, correccionesVentas: [] }, totalCF: 0 })} />);
    expect(el.textContent).toContain("$0"); // facturación de este mes = 0, esa venta es de 2020
  });

  it("muestra el desglose por medio de pago", () => {
    const hoy = new Date();
    const fechaEsteMes = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-05`;
    const ventas = [
      { id: "v1", fecha: fechaEsteMes, cantidad: 1, precioUnitario: 1000, costoUnitario: 0, medioPago: "efectivo" },
      { id: "v2", fecha: fechaEsteMes, cantidad: 1, precioUnitario: 2000, costoUnitario: 0, medioPago: "transferencia" },
    ];
    const el = montar(<SeccionVentas {...propsBase({ data: { ventas, correccionesVentas: [] }, totalCF: 0 })} />);
    expect(el.textContent).toContain("Por medio de pago");
    expect(el.textContent).toContain("Efectivo");
    expect(el.textContent).toContain("Transferencia");
  });
});

describe("SeccionVentas — historial agrupado por pedido", () => {
  it("agrupa varias líneas con el mismo pedidoId en una sola tarjeta de pedido", () => {
    const ventas = [
      { id: "v1", pedidoId: "ped1", fecha: "2026-09-01", medioPago: "efectivo", platoNombre: "Chocotorta", cantidad: 2, precioUnitario: 2500 },
      { id: "v2", pedidoId: "ped1", fecha: "2026-09-01", medioPago: "efectivo", platoNombre: "Flan", cantidad: 1, precioUnitario: 1800 },
    ];
    const el = montar(<SeccionVentas {...propsBase({ data: { ventas, correccionesVentas: [] } })} />);
    expect(el.textContent).toContain("Venta #1");
    expect(el.textContent).toContain("Chocotorta");
    expect(el.textContent).toContain("Flan");
    expect(el.textContent).toContain("$6.800,00"); // total del pedido junto
  });

  it("clickear el tacho de un pedido pide motivo antes de confirmar el borrado", () => {
    const borrarPedidoVenta = vi.fn();
    const ventas = [{ id: "v1", pedidoId: "ped1", fecha: "2026-09-01", medioPago: "efectivo", platoNombre: "Chocotorta", cantidad: 1, precioUnitario: 2500 }];
    const el = montar(<SeccionVentas {...propsBase({ data: { ventas, correccionesVentas: [] }, borrarPedidoVenta })} />);
    const btnBorrar = el.querySelector('button[title="Eliminar esta venta"]');
    act(() => btnBorrar.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(el.textContent).toContain("¿Eliminar la Venta #1");
    expect(borrarPedidoVenta).not.toHaveBeenCalled(); // todavía no confirmó

    const inputMotivo = el.querySelector('input[placeholder*="Motivo"]');
    setVal(inputMotivo, "me equivoqué");
    click(el, "Eliminar venta");
    expect(borrarPedidoVenta).toHaveBeenCalledWith("ped1", "me equivoqué");
  });

  it("cancelar el borrado no llama a borrarPedidoVenta", () => {
    const borrarPedidoVenta = vi.fn();
    const ventas = [{ id: "v1", pedidoId: "ped1", fecha: "2026-09-01", medioPago: "efectivo", platoNombre: "Chocotorta", cantidad: 1, precioUnitario: 2500 }];
    const el = montar(<SeccionVentas {...propsBase({ data: { ventas, correccionesVentas: [] }, borrarPedidoVenta })} />);
    const btnBorrar = el.querySelector('button[title="Eliminar esta venta"]');
    act(() => btnBorrar.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    click(el, "Cancelar");
    expect(borrarPedidoVenta).not.toHaveBeenCalled();
    expect(el.textContent).not.toContain("¿Eliminar la Venta");
  });
});

describe("SeccionVentas — panel de correcciones (solo admin)", () => {
  const correcciones = [{ id: "corr1", fecha: "2026-09-01", hora: "14:30", usuario: "juani", pedidoId: "ped1", motivo: "cargué mal", items: [{ platoNombre: "Torta", cantidad: 1, precioUnitario: 2000 }], total: 2000 }];

  it("ADMIN ve el panel de correcciones con hora, usuario y motivo", () => {
    const el = montar(<SeccionVentas {...propsBase({ data: { ventas: [], correccionesVentas: correcciones } })} />, "admin");
    expect(el.textContent).toContain("Correcciones de ventas");
    expect(el.textContent).toContain("14:30 hs");
    expect(el.textContent).toContain("juani");
    expect(el.textContent).toContain("cargué mal");
  });

  it("CAJERO no ve el panel de correcciones aunque existan", () => {
    const el = montar(<SeccionVentas {...propsBase({ data: { ventas: [], correccionesVentas: correcciones } })} />, "cajero");
    expect(el.textContent).not.toContain("Correcciones de ventas");
  });

  it("sin correcciones, el panel ni aparece (ni para admin)", () => {
    const el = montar(<SeccionVentas {...propsBase({ data: { ventas: [], correccionesVentas: [] } })} />, "admin");
    expect(el.textContent).not.toContain("Correcciones de ventas");
  });
});

describe("SeccionVentas — gateo por rol", () => {
  it("VISUALIZADOR no ve la tarjeta de \"Registrar una venta\"", () => {
    const el = montar(<SeccionVentas {...propsBase()} />, "visualizador");
    expect(el.textContent).not.toContain("Registrar una venta");
  });

  it("CAJERO SÍ ve la tarjeta de \"Registrar una venta\" y puede confirmar", () => {
    const el = montar(<SeccionVentas {...propsBase()} />, "cajero");
    expect(el.textContent).toContain("Registrar una venta");
  });

  it("VISUALIZADOR no ve el botón de borrar en el historial", () => {
    const ventas = [{ id: "v1", pedidoId: "ped1", fecha: "2026-09-01", medioPago: "efectivo", platoNombre: "Torta", cantidad: 1, precioUnitario: 1000 }];
    const el = montar(<SeccionVentas {...propsBase({ data: { ventas, correccionesVentas: [] } })} />, "visualizador");
    expect(el.querySelector('button[title="Eliminar esta venta"]')).toBeNull();
  });

  it("\"Usar en Pricing\" solo aparece para admin (modifica configuración de Pricing)", () => {
    const elAdmin = montar(<SeccionVentas {...propsBase()} />, "admin");
    expect(elAdmin.textContent).toContain("Usar en Pricing");
    const elCajero = montar(<SeccionVentas {...propsBase()} />, "cajero");
    expect(elCajero.textContent).not.toContain("Usar en Pricing");
  });
});
