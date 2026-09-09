import { describe, it, expect, vi } from "vitest";
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import ModalIngrediente from "../../src/features/materias/ModalIngrediente.jsx";

function montar(elemento) {
  const contenedor = document.createElement("div");
  document.body.appendChild(contenedor);
  const root = createRoot(contenedor);
  act(() => { root.render(elemento); });
  return contenedor;
}
function setVal(input, valor) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
  act(() => {
    setter.call(input, valor);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
function click(el, texto) {
  const btn = [...el.querySelectorAll("button")].find((b) => b.textContent.trim().includes(texto));
  act(() => btn.dispatchEvent(new MouseEvent("click", { bubbles: true })));
}

describe("ModalIngrediente", () => {
  it("un ingrediente nuevo con precio genera su primera entrada de historial", () => {
    // Al no haber "inicial", se considera que el precio siempre "cambió" —
    // por eso incluso la primera carga deja una entrada (fecha de hoy, ese
    // precio). Esto es consistente con ModalHistorialPrecio, que combina esta
    // entrada con el precio actual y las trata como el mismo punto.
    const onGuardar = vi.fn();
    const el = montar(<ModalIngrediente categorias={["Secos"]} onAgregarCategoria={() => {}} onGuardar={onGuardar} onClose={() => {}} />);
    const inputNombre = el.querySelector('input[placeholder="Harina 000"]');
    setVal(inputNombre, "Azúcar");
    const inputPrecio = el.querySelector('input[type="number"]');
    setVal(inputPrecio, "1500");
    click(el, "Guardar ingrediente");

    expect(onGuardar).toHaveBeenCalledTimes(1);
    const guardado = onGuardar.mock.calls[0][0];
    expect(guardado.nombre).toBe("Azúcar");
    expect(guardado.precio).toBe(1500);
    expect(guardado.id).toBeTruthy();
    const hoy = new Date().toISOString().slice(0, 10);
    expect(guardado.historial).toEqual([{ fecha: hoy, precio: 1500 }]);
  });

  it("nombre vacío NO se guarda", () => {
    const onGuardar = vi.fn();
    const el = montar(<ModalIngrediente categorias={["Secos"]} onAgregarCategoria={() => {}} onGuardar={onGuardar} onClose={() => {}} />);
    click(el, "Guardar ingrediente");
    expect(onGuardar).not.toHaveBeenCalled();
  });

  it("BUG HISTÓRICO: al cambiar el precio, la fecha del cambio es HOY (no la fecha vieja del ingrediente)", () => {
    // Este es el bug real que encontramos: antes, cambiar el precio sin tocar
    // la fecha guardaba el historial con la fecha VIEJA, pudiendo pisar un
    // punto en vez de agregar uno nuevo. Confirmamos que el fix sigue en pie.
    // Convención del historial (misma que usa la actualización masiva): cada
    // entrada es "en esta fecha, el precio PASÓ A VALER esto" — el precio
    // NUEVO, con la fecha del cambio (hoy).
    const onGuardar = vi.fn();
    const existente = { id: "i1", nombre: "Harina", categoria: "Secos", unidad: "kg", precio: 1200, proveedor: "", fechaPrecio: "2026-01-01", historial: [] };
    const el = montar(<ModalIngrediente inicial={existente} categorias={["Secos"]} onAgregarCategoria={() => {}} onGuardar={onGuardar} onClose={() => {}} />);
    const inputPrecio = el.querySelector('input[type="number"]');
    setVal(inputPrecio, "1500");
    click(el, "Guardar ingrediente");

    const guardado = onGuardar.mock.calls[0][0];
    const hoy = new Date().toISOString().slice(0, 10);
    expect(guardado.fechaPrecio).toBe(hoy);
    expect(guardado.historial).toHaveLength(1);
    expect(guardado.historial[0]).toEqual({ fecha: hoy, precio: 1500 }); // el precio NUEVO, fechado hoy
  });

  it("si el precio NO cambió, no se agrega ninguna entrada nueva al historial", () => {
    const onGuardar = vi.fn();
    const existente = { id: "i1", nombre: "Harina", categoria: "Secos", unidad: "kg", precio: 1200, proveedor: "", fechaPrecio: "2026-01-01", historial: [{ fecha: "2025-06-01", precio: 900 }] };
    const el = montar(<ModalIngrediente inicial={existente} categorias={["Secos"]} onAgregarCategoria={() => {}} onGuardar={onGuardar} onClose={() => {}} />);
    click(el, "Guardar ingrediente"); // sin tocar nada
    const guardado = onGuardar.mock.calls[0][0];
    expect(guardado.historial).toHaveLength(1); // el mismo de antes, no se duplicó nada
  });

  it("precio vacío se guarda como null, no como 0 ni NaN", () => {
    const onGuardar = vi.fn();
    const el = montar(<ModalIngrediente categorias={["Secos"]} onAgregarCategoria={() => {}} onGuardar={onGuardar} onClose={() => {}} />);
    setVal(el.querySelector('input[placeholder="Harina 000"]'), "Vino");
    click(el, "Guardar ingrediente");
    expect(onGuardar.mock.calls[0][0].precio).toBeNull();
  });
});
