import { describe, it, expect, vi } from "vitest";
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { RolContext } from "../../src/auth/usuarios.js";
import SeccionFijos from "../../src/features/costosFijos/SeccionFijos.jsx";

function montar(elemento, rol = "admin") {
  const contenedor = document.createElement("div");
  document.body.appendChild(contenedor);
  const root = createRoot(contenedor);
  act(() => { root.render(<RolContext.Provider value={rol}>{elemento}</RolContext.Provider>); });
  return contenedor;
}

const hoy = new Date();
const en15dias = new Date(hoy); en15dias.setDate(en15dias.getDate() + 15);
const hace10dias = new Date(hoy); hace10dias.setDate(hace10dias.getDate() - 10);
const fmt = (d) => d.toISOString().slice(0, 10);

const DATA = {
  costosFijos: [
    { id: "c1", nombre: "Alquiler", categoria: "Alquiler", monto: 300000, frecuencia: "mensual", notas: "", proximoAjuste: fmt(en15dias) },
    { id: "c2", nombre: "Seguro", categoria: "Seguro", monto: 120000, frecuencia: "trimestral", notas: "", proximoAjuste: fmt(hace10dias) },
  ],
};
const CFG = { horasPorDia: 10, diasPorMes: 26 };

describe("SeccionFijos", () => {
  it("el KPI de costo fijo mensual suma bien, convirtiendo el trimestral a mensual", () => {
    // 300000 (mensual) + 120000/3 (trimestral->mensual = 40000) = 340000
    const el = montar(<SeccionFijos data={DATA} totalCF={340000} setModal={() => {}} borrar={() => {}} cfg={CFG} setCfg={() => {}} />);
    expect(el.textContent).toContain("$340.000");
    expect(el.textContent).toContain("2 conceptos");
  });

  it("muestra el costo mensual ya convertido de cada gasto en la tabla", () => {
    const el = montar(<SeccionFijos data={DATA} totalCF={340000} setModal={() => {}} borrar={() => {}} cfg={CFG} setCfg={() => {}} />);
    expect(el.textContent).toContain("$40.000"); // 120000/3, el trimestral convertido
  });

  it("muestra el cartel amarillo de \"ajuste próximo\" para el gasto con fecha futura cercana", () => {
    const el = montar(<SeccionFijos data={DATA} totalCF={340000} setModal={() => {}} borrar={() => {}} cfg={CFG} setCfg={() => {}} />);
    expect(el.textContent).toContain("Ajuste en");
    expect(el.textContent).toContain("días");
  });

  it("muestra el cartel de \"ajuste vencido\" para el gasto con fecha ya pasada", () => {
    const el = montar(<SeccionFijos data={DATA} totalCF={340000} setModal={() => {}} borrar={() => {}} cfg={CFG} setCfg={() => {}} />);
    expect(el.textContent).toContain("Ajuste vencido hace");
  });

  it("ROL ADMIN: ve agregar/editar/borrar costos fijos", () => {
    const el = montar(<SeccionFijos data={DATA} totalCF={340000} setModal={() => {}} borrar={() => {}} cfg={CFG} setCfg={() => {}} />, "admin");
    expect([...el.querySelectorAll("button")].some((b) => b.textContent.trim() === "Agregar costo")).toBe(true);
    expect(el.querySelectorAll('button[title="Editar este costo fijo"]').length).toBeGreaterThan(0);
  });

  it("ROL VISUALIZADOR: no puede agregar/editar/borrar costos fijos", () => {
    const el = montar(<SeccionFijos data={DATA} totalCF={340000} setModal={() => {}} borrar={() => {}} cfg={CFG} setCfg={() => {}} />, "visualizador");
    expect([...el.querySelectorAll("button")].some((b) => b.textContent.trim() === "Agregar costo")).toBe(false);
    expect(el.querySelectorAll('button[title="Editar este costo fijo"]').length).toBe(0);
    expect(el.querySelectorAll('button[title="Eliminar este costo fijo"]').length).toBe(0);
  });

  it("borrar llama a la función borrar con los datos correctos", () => {
    const borrar = vi.fn();
    const el = montar(<SeccionFijos data={DATA} totalCF={340000} setModal={() => {}} borrar={borrar} cfg={CFG} setCfg={() => {}} />);
    const btn = el.querySelector('button[title="Eliminar este costo fijo"]');
    act(() => btn.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(borrar).toHaveBeenCalledWith("costosFijos", "c1", "Alquiler");
  });

  it("cambiar horas por día llama a setCfg con el valor numérico", () => {
    const setCfg = vi.fn();
    const el = montar(<SeccionFijos data={DATA} totalCF={340000} setModal={() => {}} borrar={() => {}} cfg={CFG} setCfg={setCfg} />);
    const input = el.querySelector('input[max="24"]');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    act(() => { setter.call(input, "12"); input.dispatchEvent(new Event("input", { bubbles: true })); });
    expect(setCfg).toHaveBeenCalledWith("horasPorDia", 12);
  });
});
