import { describe, it, expect, vi } from "vitest";
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import ModalPreciosMasivo from "../../src/features/materias/ModalPreciosMasivo.jsx";

function montar(elemento) {
  const contenedor = document.createElement("div");
  document.body.appendChild(contenedor);
  const root = createRoot(contenedor);
  act(() => { root.render(elemento); });
  return contenedor;
}
function setVal(input, valor) {
  const proto = input.tagName === "SELECT" ? window.HTMLSelectElement.prototype : window.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value").set;
  act(() => {
    setter.call(input, valor);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
function click(el, texto) {
  const btn = [...el.querySelectorAll("button")].find((b) => b.textContent.trim().includes(texto));
  act(() => btn.dispatchEvent(new MouseEvent("click", { bubbles: true })));
}

const INGREDIENTES = [
  { id: "i1", nombre: "Harina", categoria: "Secos", unidad: "kg", precio: 1000 },
  { id: "i2", nombre: "Azúcar", categoria: "Secos", unidad: "kg", precio: 2000 },
];

describe("ModalPreciosMasivo", () => {
  it("aplicar +10% a la categoría ajusta todos los precios de esa categoría", () => {
    const el = montar(<ModalPreciosMasivo ingredientes={INGREDIENTES} categorias={["Secos"]} onAplicar={() => {}} onClose={() => {}} />);
    const inputAjuste = el.querySelector('input[placeholder="12"]');
    setVal(inputAjuste, "10");
    click(el, "Aplicar a la lista");
    const inputsPrecio = el.querySelectorAll('td input[type="number"]');
    expect(Number(inputsPrecio[0].value)).toBe(1100); // 1000 * 1.10
    expect(Number(inputsPrecio[1].value)).toBe(2200); // 2000 * 1.10
  });

  it("onAplicar recibe los valores editados y la fecha", () => {
    const onAplicar = vi.fn();
    const el = montar(<ModalPreciosMasivo ingredientes={INGREDIENTES} categorias={["Secos"]} onAplicar={onAplicar} onClose={() => {}} />);
    const inputsPrecio = el.querySelectorAll('td input[type="number"]');
    setVal(inputsPrecio[0], "1234");
    click(el, "Guardar precios");
    expect(onAplicar).toHaveBeenCalledTimes(1);
    const [valores, fecha] = onAplicar.mock.calls[0];
    expect(valores.i1).toBe("1234");
    expect(fecha).toBeTruthy();
  });

  it("solo muestra los ingredientes de la categoría elegida", () => {
    const conOtraCategoria = [...INGREDIENTES, { id: "i3", nombre: "Leche", categoria: "Lácteos", unidad: "litro", precio: 900 }];
    const el = montar(<ModalPreciosMasivo ingredientes={conOtraCategoria} categorias={["Secos", "Lácteos"]} onAplicar={() => {}} onClose={() => {}} />);
    expect(el.textContent).toContain("Harina");
    expect(el.textContent).not.toContain("Leche");
  });
});
