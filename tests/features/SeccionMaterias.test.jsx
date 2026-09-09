import { describe, it, expect, vi } from "vitest";
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { RolContext } from "../../src/auth/usuarios.js";
import SeccionMaterias from "../../src/features/materias/SeccionMaterias.jsx";

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

const DATA = {
  ingredientes: [
    { id: "i1", nombre: "Harina 000", categoria: "Secos", unidad: "kg", precio: 1000, proveedor: "Molinos", fechaPrecio: "2026-08-01", historial: [] },
    { id: "i2", nombre: "Leche", categoria: "Lácteos", unidad: "litro", precio: null, proveedor: "", fechaPrecio: null, historial: [] },
  ],
};
const CFG = { categoriasIngredientes: ["Secos", "Lácteos"] };

describe("SeccionMaterias", () => {
  it("muestra la cantidad de ingredientes y cuántos están sin precio", () => {
    const el = montar(<SeccionMaterias data={DATA} setModal={() => {}} borrar={() => {}} cfg={CFG} setCfg={() => {}} />);
    expect(el.textContent).toContain("2 ingredientes cargados");
    expect(el.textContent).toContain("1 sin precio");
  });

  it("el buscador filtra por nombre en vivo", () => {
    const el = montar(<SeccionMaterias data={DATA} setModal={() => {}} borrar={() => {}} cfg={CFG} setCfg={() => {}} />);
    const input = el.querySelector('input[placeholder="Buscar por nombre…"]');
    setVal(input, "harina");
    expect(el.textContent).toContain("Harina 000");
    expect(el.textContent).not.toContain("Leche");
  });

  it("el filtro por categoría funciona", () => {
    const el = montar(<SeccionMaterias data={DATA} setModal={() => {}} borrar={() => {}} cfg={CFG} setCfg={() => {}} />);
    const select = [...el.querySelectorAll("select")].find((s) => [...s.options].some((o) => o.value === "Lácteos"));
    setVal(select, "Lácteos");
    expect(el.textContent).toContain("Leche");
    expect(el.textContent).not.toContain("Harina 000");
  });

  it("un ingrediente sin precio se marca visualmente (🔴 y \"Sin precio\")", () => {
    const el = montar(<SeccionMaterias data={DATA} setModal={() => {}} borrar={() => {}} cfg={CFG} setCfg={() => {}} />);
    expect(el.textContent).toContain("🔴");
    expect(el.textContent).toContain("Sin precio");
  });

  it("ROL ADMIN: ve los botones de agregar, actualizar precios, editar y borrar", () => {
    const el = montar(<SeccionMaterias data={DATA} setModal={() => {}} borrar={() => {}} cfg={CFG} setCfg={() => {}} />, "admin");
    expect(el.textContent).toContain("Agregar ingrediente");
    expect(el.textContent).toContain("Actualizar precios");
    expect(el.querySelectorAll('button[title="Editar este ingrediente"]').length).toBeGreaterThan(0);
    expect(el.querySelectorAll('button[title="Eliminar este ingrediente"]').length).toBeGreaterThan(0);
  });

  it("ROL VISUALIZADOR: NO ve ningún botón de mutación, pero SÍ el de historial", () => {
    const el = montar(<SeccionMaterias data={DATA} setModal={() => {}} borrar={() => {}} cfg={CFG} setCfg={() => {}} />, "visualizador");
    expect(el.textContent).not.toContain("Agregar ingrediente");
    expect([...el.querySelectorAll("button")].some((b) => b.textContent.trim() === "Actualizar precios")).toBe(false);
    expect(el.querySelectorAll('button[title="Editar este ingrediente"]').length).toBe(0);
    expect(el.querySelectorAll('button[title="Eliminar este ingrediente"]').length).toBe(0);
    expect(el.querySelectorAll('button[title="Ver historial de precio"]').length).toBeGreaterThan(0);
  });

  it("ROL CAJERO: tampoco puede tocar el catálogo (mismo comportamiento que visualizador acá)", () => {
    const el = montar(<SeccionMaterias data={DATA} setModal={() => {}} borrar={() => {}} cfg={CFG} setCfg={() => {}} />, "cajero");
    expect(el.textContent).not.toContain("Agregar ingrediente");
    expect(el.querySelectorAll('button[title="Eliminar este ingrediente"]').length).toBe(0);
  });

  it("clickear \"Agregar ingrediente\" llama a setModal con tipo ing", () => {
    const setModal = vi.fn();
    const el = montar(<SeccionMaterias data={DATA} setModal={setModal} borrar={() => {}} cfg={CFG} setCfg={() => {}} />);
    const btn = [...el.querySelectorAll("button")].find((b) => b.textContent.includes("Agregar ingrediente"));
    act(() => btn.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(setModal).toHaveBeenCalledWith({ tipo: "ing" });
  });

  it("clickear \"Eliminar\" llama a borrar con los datos correctos", () => {
    const borrar = vi.fn();
    const el = montar(<SeccionMaterias data={DATA} setModal={() => {}} borrar={borrar} cfg={CFG} setCfg={() => {}} />);
    const btn = el.querySelector('button[title="Eliminar este ingrediente"]');
    act(() => btn.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(borrar).toHaveBeenCalledWith("ingredientes", "i1", "Harina 000");
  });

  it("clickear el ícono de historial abre el modal de historial de ese ingrediente", () => {
    const el = montar(<SeccionMaterias data={DATA} setModal={() => {}} borrar={() => {}} cfg={CFG} setCfg={() => {}} />);
    const btn = el.querySelector('button[title="Ver historial de precio"]');
    act(() => btn.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(el.textContent).toContain("Historial de precio");
  });

  it("sin resultados de búsqueda, muestra el mensaje correspondiente", () => {
    const el = montar(<SeccionMaterias data={DATA} setModal={() => {}} borrar={() => {}} cfg={CFG} setCfg={() => {}} />);
    setVal(el.querySelector('input[placeholder="Buscar por nombre…"]'), "xyzxyz");
    expect(el.textContent).toContain("No hay ingredientes que coincidan");
  });
});
