import { describe, it, expect, vi } from "vitest";
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import ChecklistPrimerosPasos from "../../src/shell/ChecklistPrimerosPasos.jsx";

function montar(elemento) {
  const contenedor = document.createElement("div");
  document.body.appendChild(contenedor);
  const root = createRoot(contenedor);
  act(() => { root.render(elemento); });
  return contenedor;
}

const dataVacia = { ingredientes: [], platos: [], costosFijos: [], ventas: [] };
const dataCompleta = {
  ingredientes: [{ id: "i1" }], platos: [{ id: "p1" }], costosFijos: [{ id: "c1" }], ventas: [{ id: "v1" }],
};

describe("ChecklistPrimerosPasos", () => {
  it("con todo sin cargar, muestra 0/4 y los 4 pasos", () => {
    const el = montar(<ChecklistPrimerosPasos data={dataVacia} cfg={{}} setCfg={() => {}} setTab={() => {}} />);
    expect(el.textContent).toContain("0/4");
    expect(el.textContent).toContain("Cargar tus primeras materias primas");
  });

  it("con todo cargado, no se muestra nada (return null)", () => {
    const el = montar(<ChecklistPrimerosPasos data={dataCompleta} cfg={{}} setCfg={() => {}} setTab={() => {}} />);
    expect(el.innerHTML).toBe("");
  });

  it("si cfg.ocultarChecklist es true, no se muestra aunque falte todo", () => {
    const el = montar(<ChecklistPrimerosPasos data={dataVacia} cfg={{ ocultarChecklist: true }} setCfg={() => {}} setTab={() => {}} />);
    expect(el.innerHTML).toBe("");
  });

  it("clickear \"Ocultar\" llama a setCfg con ocultarChecklist=true", () => {
    const setCfg = vi.fn();
    const el = montar(<ChecklistPrimerosPasos data={dataVacia} cfg={{}} setCfg={setCfg} setTab={() => {}} />);
    const btn = [...el.querySelectorAll("button")].find((b) => b.textContent.trim() === "Ocultar");
    act(() => btn.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(setCfg).toHaveBeenCalledWith("ocultarChecklist", true);
  });

  it("clickear un paso pendiente navega a esa pestaña", () => {
    const setTab = vi.fn();
    const el = montar(<ChecklistPrimerosPasos data={dataVacia} cfg={{}} setCfg={() => {}} setTab={setTab} />);
    const btn = [...el.querySelectorAll("button")].find((b) => b.textContent.includes("Armar tu primer plato"));
    act(() => btn.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(setTab).toHaveBeenCalledWith("platos");
  });

  it("con 2 de 4 pasos hechos, muestra 2/4", () => {
    const dataParcial = { ingredientes: [{ id: "i1" }], platos: [{ id: "p1" }], costosFijos: [], ventas: [] };
    const el = montar(<ChecklistPrimerosPasos data={dataParcial} cfg={{}} setCfg={() => {}} setTab={() => {}} />);
    expect(el.textContent).toContain("2/4");
  });
});
