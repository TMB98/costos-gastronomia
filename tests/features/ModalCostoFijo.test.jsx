import { describe, it, expect, vi } from "vitest";
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import ModalCostoFijo from "../../src/features/costosFijos/ModalCostoFijo.jsx";

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

describe("ModalCostoFijo", () => {
  it("muestra en vivo la conversión de un gasto trimestral a mensual", () => {
    const el = montar(<ModalCostoFijo categorias={["Alquiler"]} onAgregarCategoria={() => {}} onGuardar={() => {}} onClose={() => {}} />);
    const inputMonto = el.querySelector('input[type="number"]');
    setVal(inputMonto, "300000");
    const selectFrecuencia = [...el.querySelectorAll("select")].find((s) => [...s.options].some((o) => o.value === "trimestral"));
    setVal(selectFrecuencia, "trimestral");
    expect(el.textContent).toContain("$100.000");
  });

  it("guarda el monto como número, no como string", () => {
    const onGuardar = vi.fn();
    const el = montar(<ModalCostoFijo categorias={["Alquiler"]} onAgregarCategoria={() => {}} onGuardar={onGuardar} onClose={() => {}} />);
    setVal(el.querySelector('input[placeholder="Alquiler del local"]'), "Alquiler");
    setVal(el.querySelector('input[type="number"]'), "500000");
    click(el, "Guardar costo");
    const guardado = onGuardar.mock.calls[0][0];
    expect(guardado.monto).toBe(500000);
    expect(typeof guardado.monto).toBe("number");
  });

  it("nombre vacío no guarda", () => {
    const onGuardar = vi.fn();
    const el = montar(<ModalCostoFijo categorias={["Alquiler"]} onAgregarCategoria={() => {}} onGuardar={onGuardar} onClose={() => {}} />);
    click(el, "Guardar costo");
    expect(onGuardar).not.toHaveBeenCalled();
  });

  it("el campo de próximo ajuste es opcional y se puede cargar", () => {
    const onGuardar = vi.fn();
    const el = montar(<ModalCostoFijo categorias={["Alquiler"]} onAgregarCategoria={() => {}} onGuardar={onGuardar} onClose={() => {}} />);
    setVal(el.querySelector('input[placeholder="Alquiler del local"]'), "Alquiler");
    const inputFecha = el.querySelector('input[type="date"]');
    setVal(inputFecha, "2026-12-01");
    click(el, "Guardar costo");
    expect(onGuardar.mock.calls[0][0].proximoAjuste).toBe("2026-12-01");
  });
});
