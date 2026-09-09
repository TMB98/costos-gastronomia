import { describe, it, expect, vi } from "vitest";
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { RolContext } from "../../src/auth/usuarios.js";
import { calcPlato, netoDe, semaforo } from "../../src/lib/calculos.js";
import SeccionPlatos from "../../src/features/platos/SeccionPlatos.jsx";

function montar(elemento, rol = "admin") {
  const contenedor = document.createElement("div");
  document.body.appendChild(contenedor);
  const root = createRoot(contenedor);
  act(() => { root.render(<RolContext.Provider value={rol}>{elemento}</RolContext.Provider>); });
  return contenedor;
}

const CFG = { iva: 21, preciosIncluyenIVA: false, categoriasPlatos: ["Postre"] };
const MAP_ING = { i1: { id: "i1", nombre: "Harina", unidad: "kg", precio: 1000 } };

// Construimos platosCalc EXACTAMENTE como lo hace App(): calcPlato + netoDe + semaforo por plato.
function construirPlatoCalc(plato) {
  const calc = calcPlato(plato, MAP_ING);
  const neto = netoDe(plato.precioVenta, CFG);
  const margen = neto > 0 && !calc.incompleto ? ((neto - calc.costoPorcion) / neto) * 100 : null;
  const sem = semaforo(calc.incompleto ? null : margen);
  return { ...plato, ...calc, neto, margen, sem };
}

const PLATO_OK = construirPlatoCalc({
  id: "p1", nombre: "Torta", categoria: "Postre", descripcion: "", foto: "", porciones: 4, tiempo: 30, notas: "Batir bien",
  precioVenta: 2000, items: [{ id: "l1", ingId: "i1", cantidad: 1, unidad: "kg" }],
});
const PLATO_INCOMPLETO = construirPlatoCalc({
  id: "p2", nombre: "Flan", categoria: "Postre", descripcion: "", foto: "", porciones: 2, tiempo: 20, notas: "",
  precioVenta: 1500, items: [{ id: "l2", ingId: "i-no-existe", cantidad: 1, unidad: "kg" }],
});

describe("SeccionPlatos", () => {
  it("muestra el costo, precio y margen de un plato completo", () => {
    const el = montar(<SeccionPlatos platosCalc={[PLATO_OK]} cfg={CFG} setCfg={() => {}} setModal={() => {}} borrar={() => {}} duplicarPlato={() => {}} />);
    expect(el.textContent).toContain("Torta");
    expect(el.textContent).toContain("$2.000,00"); // precio de venta
  });

  it("un plato incompleto muestra \"Incompleto\" en vez de un costo inventado", () => {
    const el = montar(<SeccionPlatos platosCalc={[PLATO_INCOMPLETO]} cfg={CFG} setCfg={() => {}} setModal={() => {}} borrar={() => {}} duplicarPlato={() => {}} />);
    expect(el.textContent).toContain("Incompleto");
    expect(el.textContent).toContain("Costo incompleto");
  });

  it("\"Ver receta\" despliega el detalle de ingredientes y lo puede volver a ocultar", () => {
    const el = montar(<SeccionPlatos platosCalc={[PLATO_OK]} cfg={CFG} setCfg={() => {}} setModal={() => {}} borrar={() => {}} duplicarPlato={() => {}} />);
    const btn = [...el.querySelectorAll("button")].find((b) => b.textContent.trim() === "Ver receta");
    act(() => btn.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(el.textContent).toContain("Costo total de la receta");
    expect(el.textContent).toContain("Batir bien"); // las notas de la receta
    const btnOcultar = [...el.querySelectorAll("button")].find((b) => b.textContent.trim() === "Ocultar");
    act(() => btnOcultar.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(el.textContent).not.toContain("Costo total de la receta");
  });

  it("ROL ADMIN: ve editar, duplicar y borrar", () => {
    const el = montar(<SeccionPlatos platosCalc={[PLATO_OK]} cfg={CFG} setCfg={() => {}} setModal={() => {}} borrar={() => {}} duplicarPlato={() => {}} />, "admin");
    expect(el.querySelector('button[title="Editar este plato"]')).not.toBeNull();
    expect(el.querySelector('button[title="Duplicar este plato"]')).not.toBeNull();
    expect(el.querySelector('button[title="Eliminar este plato"]')).not.toBeNull();
  });

  it("ROL VISUALIZADOR: no ve editar/duplicar/borrar, pero sí \"Ver receta\"", () => {
    const el = montar(<SeccionPlatos platosCalc={[PLATO_OK]} cfg={CFG} setCfg={() => {}} setModal={() => {}} borrar={() => {}} duplicarPlato={() => {}} />, "visualizador");
    expect(el.querySelector('button[title="Editar este plato"]')).toBeNull();
    expect(el.querySelector('button[title="Duplicar este plato"]')).toBeNull();
    expect(el.querySelector('button[title="Eliminar este plato"]')).toBeNull();
    expect([...el.querySelectorAll("button")].some((b) => b.textContent.trim() === "Ver receta")).toBe(true);
  });

  it("duplicar llama a duplicarPlato con el plato correcto", () => {
    const duplicarPlato = vi.fn();
    const el = montar(<SeccionPlatos platosCalc={[PLATO_OK]} cfg={CFG} setCfg={() => {}} setModal={() => {}} borrar={() => {}} duplicarPlato={duplicarPlato} />);
    const btn = el.querySelector('button[title="Duplicar este plato"]');
    act(() => btn.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(duplicarPlato).toHaveBeenCalledWith(PLATO_OK);
  });

  it("sin platos todavía, muestra el mensaje de \"agregá el primero\"", () => {
    const el = montar(<SeccionPlatos platosCalc={[]} cfg={CFG} setCfg={() => {}} setModal={() => {}} borrar={() => {}} duplicarPlato={() => {}} />);
    expect(el.textContent).toContain("Todavía no hay platos");
  });

  it("la búsqueda filtra por nombre", () => {
    const el = montar(<SeccionPlatos platosCalc={[PLATO_OK, PLATO_INCOMPLETO]} cfg={CFG} setCfg={() => {}} setModal={() => {}} borrar={() => {}} duplicarPlato={() => {}} />);
    const input = el.querySelector('input[placeholder="Buscar plato por nombre…"]');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    act(() => { setter.call(input, "flan"); input.dispatchEvent(new Event("input", { bubbles: true })); });
    expect(el.textContent).toContain("Flan");
    expect(el.textContent).not.toContain("Torta");
  });
});
