import { describe, it, expect, vi } from "vitest";
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import BuscadorGlobal from "../../src/shell/BuscadorGlobal.jsx";

function montar(elemento) {
  const contenedor = document.createElement("div");
  document.body.appendChild(contenedor);
  const root = createRoot(contenedor);
  act(() => { root.render(elemento); });
  return { contenedor, root };
}
function setVal(input, valor) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
  act(() => {
    setter.call(input, valor);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

const DATA = {
  ingredientes: [
    { id: "i1", nombre: "Harina 000", precio: 1000 },
    { id: "i2", nombre: "Azúcar", precio: null },
  ],
};
const PLATOS_CALC = [
  { id: "p1", nombre: "Chocotorta", precioVenta: 3500 },
];

describe("BuscadorGlobal", () => {
  it("cerrado (abierto=false) no renderiza nada", () => {
    const { contenedor } = montar(<BuscadorGlobal abierto={false} setAbierto={() => {}} data={DATA} platosCalc={PLATOS_CALC} setTab={() => {}} setModal={() => {}} />);
    expect(contenedor.textContent).toBe("");
  });

  it("abierto, sin texto todavía, invita a escribir", () => {
    const { contenedor } = montar(<BuscadorGlobal abierto={true} setAbierto={() => {}} data={DATA} platosCalc={PLATOS_CALC} setTab={() => {}} setModal={() => {}} />);
    expect(contenedor.textContent).toContain("Empezá a escribir");
  });

  it("busca un plato por nombre y lo muestra con su precio", () => {
    const { contenedor } = montar(<BuscadorGlobal abierto={true} setAbierto={() => {}} data={DATA} platosCalc={PLATOS_CALC} setTab={() => {}} setModal={() => {}} />);
    const input = contenedor.querySelector("input");
    setVal(input, "choco");
    expect(contenedor.textContent).toContain("Chocotorta");
    expect(contenedor.textContent).toContain("$3.500,00");
  });

  it("busca un ingrediente sin precio y lo marca como \"sin precio\"", () => {
    const { contenedor } = montar(<BuscadorGlobal abierto={true} setAbierto={() => {}} data={DATA} platosCalc={PLATOS_CALC} setTab={() => {}} setModal={() => {}} />);
    setVal(contenedor.querySelector("input"), "azú");
    expect(contenedor.textContent).toContain("Azúcar");
    expect(contenedor.textContent).toContain("sin precio");
  });

  it("sin resultados, avisa que no encontró nada", () => {
    const { contenedor } = montar(<BuscadorGlobal abierto={true} setAbierto={() => {}} data={DATA} platosCalc={PLATOS_CALC} setTab={() => {}} setModal={() => {}} />);
    setVal(contenedor.querySelector("input"), "xyzxyz");
    expect(contenedor.textContent).toContain("No encontré nada");
  });

  it("clickear un plato encontrado navega a Platos, abre su modal, y cierra el buscador", () => {
    const setTab = vi.fn();
    const setModal = vi.fn();
    const setAbierto = vi.fn();
    const { contenedor } = montar(<BuscadorGlobal abierto={true} setAbierto={setAbierto} data={DATA} platosCalc={PLATOS_CALC} setTab={setTab} setModal={setModal} />);
    setVal(contenedor.querySelector("input"), "choco");
    const btn = [...contenedor.querySelectorAll("button")].find((b) => b.textContent.includes("Chocotorta"));
    act(() => btn.dispatchEvent(new MouseEvent("click", { bubbles: true })));

    expect(setTab).toHaveBeenCalledWith("platos");
    expect(setModal).toHaveBeenCalledWith({ tipo: "plato", item: PLATOS_CALC[0] });
    expect(setAbierto).toHaveBeenCalledWith(false);
  });

  it("clickear un ingrediente encontrado navega a Materias primas y abre su modal", () => {
    const setTab = vi.fn();
    const setModal = vi.fn();
    const { contenedor } = montar(<BuscadorGlobal abierto={true} setAbierto={() => {}} data={DATA} platosCalc={PLATOS_CALC} setTab={setTab} setModal={setModal} />);
    setVal(contenedor.querySelector("input"), "harina");
    const btn = [...contenedor.querySelectorAll("button")].find((b) => b.textContent.includes("Harina 000"));
    act(() => btn.dispatchEvent(new MouseEvent("click", { bubbles: true })));

    expect(setTab).toHaveBeenCalledWith("materias");
    expect(setModal).toHaveBeenCalledWith({ tipo: "ing", item: DATA.ingredientes[0] });
  });

  it("presionar Escape cierra el buscador", () => {
    const setAbierto = vi.fn();
    const { contenedor } = montar(<BuscadorGlobal abierto={true} setAbierto={setAbierto} data={DATA} platosCalc={PLATOS_CALC} setTab={() => {}} setModal={() => {}} />);
    const input = contenedor.querySelector("input");
    act(() => input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
    expect(setAbierto).toHaveBeenCalledWith(false);
  });

  it("clickear el fondo (fuera del cuadro) cierra el buscador", () => {
    const setAbierto = vi.fn();
    const { contenedor } = montar(<BuscadorGlobal abierto={true} setAbierto={setAbierto} data={DATA} platosCalc={PLATOS_CALC} setTab={() => {}} setModal={() => {}} />);
    const fondo = contenedor.firstChild;
    act(() => fondo.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(setAbierto).toHaveBeenCalledWith(false);
  });
});
