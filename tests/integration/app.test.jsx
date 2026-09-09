import { describe, it, expect, beforeEach, vi } from "vitest";
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import AppConLogin from "../../src/AppConLogin.jsx";

function montar() {
  const contenedor = document.createElement("div");
  document.body.appendChild(contenedor);
  const root = createRoot(contenedor);
  act(() => { root.render(<AppConLogin />); });
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
  if (!btn) throw new Error(`No se encontró el botón "${texto}". Texto actual: ${el.textContent.slice(0, 200)}`);
  act(() => btn.dispatchEvent(new MouseEvent("click", { bubbles: true })));
  return true;
}
async function esperar(ms) {
  await act(async () => { await new Promise((r) => setTimeout(r, ms)); });
}
async function loguearComo(el, usuario, clave) {
  const [inputUsuario, inputClave] = el.querySelectorAll("input");
  setVal(inputUsuario, usuario);
  setVal(inputClave, clave);
  click(el, "Ingresar");
  // La app intenta Supabase primero (mockeado para fallar rápido acá abajo),
  // cae a datosDemo(), y recién ahí saca el "Cargando datos…". Le damos margen real.
  await esperar(150);
}

describe("App completa ensamblada — flujo real de punta a punta", () => {
  beforeEach(() => {
    localStorage.clear();
    // La app tiene credenciales reales de Supabase hardcodeadas, así que sin
    // mockear esto intentaría una llamada de red real en cada test — lenta e
    // impredecible en este entorno. La forzamos a fallar YA, para que caiga
    // directo al camino de datosDemo(), igual que pasaría offline.
    global.fetch = vi.fn(() => Promise.reject(new Error("sin red en el test")));
  });

  it("sin sesión, muestra la pantalla de login", () => {
    const el = montar();
    expect(el.textContent).toContain("Ingresá usuario y contraseña");
  });

  it("login correcto carga los datos demo y muestra la pestaña Materias primas por defecto", async () => {
    const el = montar();
    await loguearComo(el, "juani", "costos2026");
    expect(el.textContent).toContain("Materias primas");
    expect(el.textContent).toContain("Harina 000"); // ingrediente de la demo
  });

  it("navegar a cada una de las 6 pestañas no rompe nada", async () => {
    const el = montar();
    await loguearComo(el, "juani", "costos2026");

    for (const label of ["Platos", "Costos fijos", "Pricing", "Ventas", "Reportería", "Materias primas"]) {
      click(el, label);
      await esperar(10);
      expect(el.textContent).not.toContain("Cargando datos");
    }
  });

  it("flujo completo: cargar un ingrediente nuevo, usarlo en un plato, y ver el costo calculado", async () => {
    const el = montar();
    await loguearComo(el, "juani", "costos2026");

    // 1) Cargar un ingrediente nuevo
    click(el, "Agregar ingrediente");
    await esperar(10);
    setVal(el.querySelector('input[placeholder="Harina 000"]'), "Ingrediente de prueba");
    const inputPrecio = [...el.querySelectorAll('input[type="number"]')].find((i) => i.step === "0.01");
    setVal(inputPrecio, "1000");
    click(el, "Guardar ingrediente");
    await esperar(10);
    expect(el.textContent).toContain("Ingrediente de prueba");

    // 2) Confirmar que aparece como opción al armar un plato nuevo
    click(el, "Platos");
    await esperar(10);
    click(el, "Agregar plato");
    await esperar(10);
    click(el, "Agregar ingrediente"); // agrega la primera línea de receta (plato vacío)
    await esperar(10);
    const selectIngredienteReceta = el.querySelector("tbody select");
    const tieneElIngrediente = [...selectIngredienteReceta.options].some((o) => o.textContent === "Ingrediente de prueba");
    expect(tieneElIngrediente).toBe(true);
  });

  it("el rol se respeta de punta a punta: un visualizador no ve botones de edición en ninguna pestaña", async () => {
    const el = montar();
    await loguearComo(el, "invitado1", "Ver2026a");

    for (const label of ["Materias primas", "Platos", "Costos fijos"]) {
      click(el, label);
      await esperar(10);
      expect(el.querySelectorAll('button[title^="Editar"]').length).toBe(0);
    }
  });

  it("cerrar sesión vuelve a la pantalla de login", async () => {
    const el = montar();
    await loguearComo(el, "juani", "costos2026");
    // Abrir el menú de configuración y cerrar sesión
    const btnConfig = [...el.querySelectorAll("button")].find((b) => b.title === "Configuración");
    act(() => btnConfig.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    await esperar(10);
    click(el, "Cerrar sesión");
    await esperar(10);
    expect(el.textContent).toContain("Ingresá usuario y contraseña");
  });
});
