import { describe, it, expect, vi } from "vitest";
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import ModalPlato from "../../src/features/platos/ModalPlato.jsx";

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
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
}
function click(el, texto) {
  const btn = [...el.querySelectorAll("button")].find((b) => b.textContent.trim().includes(texto));
  act(() => btn.dispatchEvent(new MouseEvent("click", { bubbles: true })));
}

const INGREDIENTES = [
  { id: "i1", nombre: "Harina", unidad: "kg", precio: 1000 },
  { id: "i2", nombre: "Azúcar", unidad: "kg", precio: 1500 },
];
const CONFIG = { iva: 21, preciosIncluyenIVA: false, categoriasPlatos: ["Postre"] };

describe("ModalPlato", () => {
  it("agregar un ingrediente a la receta actualiza el costo total en vivo", () => {
    const el = montar(<ModalPlato ingredientes={INGREDIENTES} config={CONFIG} onAgregarCategoria={() => {}} onGuardar={() => {}} onClose={() => {}} />);
    click(el, "Agregar ingrediente");
    // El primer ingrediente de la lista (Harina, $1000/kg) se agrega con cantidad 1 por defecto
    expect(el.textContent).toContain("$1.000,00"); // costo total = 1 kg * $1000
  });

  it("cambiar la cantidad recalcula el costo de la línea en vivo", () => {
    const el = montar(<ModalPlato ingredientes={INGREDIENTES} config={CONFIG} onAgregarCategoria={() => {}} onGuardar={() => {}} onClose={() => {}} />);
    click(el, "Agregar ingrediente");
    const inputCantidad = el.querySelector('input[step="0.001"]');
    setVal(inputCantidad, "3");
    expect(el.textContent).toContain("$3.000,00");
  });

  it("un ingrediente sin precio marca el plato como incompleto, sin costo inventado", () => {
    const ingredientesConSinPrecio = [...INGREDIENTES, { id: "i3", nombre: "Vino", unidad: "litro", precio: null }];
    const el = montar(<ModalPlato ingredientes={ingredientesConSinPrecio} config={CONFIG} onAgregarCategoria={() => {}} onGuardar={() => {}} onClose={() => {}} />);
    click(el, "Agregar ingrediente");
    const selectIngrediente = el.querySelector("tbody select");
    setVal(selectIngrediente, "i3");
    expect(el.textContent).toContain("no tiene precio cargado");
    expect(el.textContent).toContain("El costo está incompleto");
  });

  it("guardar calcula bien id, porciones mínimas y precioVenta numérico", () => {
    const onGuardar = vi.fn();
    const el = montar(<ModalPlato ingredientes={INGREDIENTES} config={CONFIG} onAgregarCategoria={() => {}} onGuardar={onGuardar} onClose={() => {}} />);
    const inputNombre = el.querySelector('input[placeholder="Chocotorta"]');
    setVal(inputNombre, "Torta de manzana");
    const inputPrecioVenta = [...el.querySelectorAll('input[type="number"]')].find((i) => i.step === "0.01" && !i.closest("td"));
    setVal(inputPrecioVenta, "2500");
    click(el, "Guardar plato");

    expect(onGuardar).toHaveBeenCalledTimes(1);
    const guardado = onGuardar.mock.calls[0][0];
    expect(guardado.nombre).toBe("Torta de manzana");
    expect(guardado.precioVenta).toBe(2500);
    expect(guardado.porciones).toBeGreaterThanOrEqual(1);
    expect(guardado.id).toBeTruthy();
  });

  it("nombre vacío no guarda nada", () => {
    const onGuardar = vi.fn();
    const el = montar(<ModalPlato ingredientes={INGREDIENTES} config={CONFIG} onAgregarCategoria={() => {}} onGuardar={onGuardar} onClose={() => {}} />);
    click(el, "Guardar plato");
    expect(onGuardar).not.toHaveBeenCalled();
  });

  it("quitar un ingrediente de la receta lo saca de la tabla", () => {
    const el = montar(<ModalPlato ingredientes={INGREDIENTES} config={CONFIG} onAgregarCategoria={() => {}} onGuardar={() => {}} onClose={() => {}} />);
    click(el, "Agregar ingrediente");
    expect(el.querySelectorAll("tbody tr")).toHaveLength(1);
    const btnQuitar = el.querySelector('button[title="Quitar este ingrediente de la receta"]');
    act(() => btnQuitar.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(el.querySelectorAll("tbody tr")).toHaveLength(0);
  });
});
