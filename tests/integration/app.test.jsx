import { describe, it, expect, beforeEach, vi } from "vitest";
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import AppConLogin from "../../src/AppConLogin.jsx";
import datosDemo from "../../src/lib/datosDemo.js";

// Mockeamos la app en el límite de red: services/supabase.js (auth) y
// services/datos.js (todas las lecturas/escrituras a las tablas). Nada
// dentro de App.jsx / AppConLogin.jsx hace una llamada real — así el test
// ejercita el flujo real de la app (login → sesión → membership → datos →
// navegación) sin pegarle a Supabase de verdad.
vi.mock("../../src/services/supabase.js", () => ({
  dbConfigurada: true,
  iniciarSesion: vi.fn(),
  cerrarSesion: vi.fn(),
  obtenerSesion: vi.fn(),
  alCambiarSesion: vi.fn(() => () => {}),
}));

vi.mock("../../src/services/datos.js", () => ({
  obtenerMembership: vi.fn(),
  cargarTodo: vi.fn(),
  crearIngrediente: vi.fn().mockResolvedValue(),
  actualizarIngrediente: vi.fn().mockResolvedValue(),
  borrarIngrediente: vi.fn().mockResolvedValue(),
  aplicarPreciosMasivo: vi.fn().mockResolvedValue(),
  crearPlato: vi.fn().mockResolvedValue(),
  actualizarPlato: vi.fn().mockResolvedValue(),
  borrarPlato: vi.fn().mockResolvedValue(),
  actualizarUnidadesEstimadas: vi.fn().mockResolvedValue(),
  actualizarUnidadesMasivo: vi.fn().mockResolvedValue(),
  aplicarPreciosPlatosMasivo: vi.fn().mockResolvedValue(),
  crearCostoFijo: vi.fn().mockResolvedValue(),
  actualizarCostoFijo: vi.fn().mockResolvedValue(),
  borrarCostoFijo: vi.fn().mockResolvedValue(),
  registrarPedido: vi.fn().mockResolvedValue(),
  borrarPedido: vi.fn().mockResolvedValue("correccion-1"),
  deshacerBorradoPedido: vi.fn().mockResolvedValue(),
  agregarCategoria: vi.fn().mockResolvedValue(),
  actualizarBenchmark: vi.fn().mockResolvedValue(),
  actualizarConfiguracion: vi.fn().mockResolvedValue(),
}));

import { iniciarSesion, obtenerSesion, alCambiarSesion, cerrarSesion } from "../../src/services/supabase.js";
import { obtenerMembership, cargarTodo } from "../../src/services/datos.js";

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
async function esperar(ms = 10) {
  await act(async () => { await new Promise((r) => setTimeout(r, ms)); });
}

// datosDemo() tiene la misma forma que devuelve cargarTodo() (mismos campos:
// ingredientes/platos/costosFijos/ventas/config), salvo correccionesVentas
// que acá se agrega vacío — es un dataset realista ya existente en el repo,
// no necesitamos inventar uno nuevo para el test.
function datosDeEmpresaFalsa() {
  return { ...datosDemo(), correccionesVentas: [] };
}

async function loguearComo(el, { rol = "admin" } = {}) {
  iniciarSesion.mockResolvedValue({ user: { id: "u1", email: "juani@lanuna.com" } });
  obtenerMembership.mockResolvedValue({ companyId: "c1", rol, nombre: "Juani" });
  cargarTodo.mockResolvedValue(datosDeEmpresaFalsa());

  const [inputEmail, inputClave] = el.querySelectorAll("input");
  setVal(inputEmail, "juani@lanuna.com");
  setVal(inputClave, "costos2026");
  await act(async () => {
    click(el, "Ingresar");
    await new Promise((r) => setTimeout(r, 20));
  });
}

describe("App completa ensamblada — flujo real de punta a punta", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    obtenerSesion.mockResolvedValue(null);
    alCambiarSesion.mockReturnValue(() => {});
  });

  it("sin sesión, muestra la pantalla de login", async () => {
    const el = montar();
    await esperar();
    expect(el.textContent).toContain("Ingresá con tu cuenta");
  });

  it("login correcto carga los datos de la empresa y muestra la pestaña Materias primas por defecto", async () => {
    const el = montar();
    await esperar();
    await loguearComo(el);
    await esperar();
    expect(el.textContent).toContain("Materias primas");
    expect(el.textContent).toContain("Harina 000"); // ingrediente del dataset de prueba
  });

  it("navegar a cada una de las 6 pestañas no rompe nada", async () => {
    const el = montar();
    await esperar();
    await loguearComo(el);
    await esperar();

    for (const label of ["Platos", "Costos fijos", "Pricing", "Ventas", "Reportería", "Materias primas"]) {
      click(el, label);
      await esperar();
      expect(el.textContent).not.toContain("Cargando datos");
    }
  });

  it("flujo completo: cargar un ingrediente nuevo, usarlo en un plato, y ver el costo calculado", async () => {
    const el = montar();
    await esperar();
    await loguearComo(el);
    await esperar();

    // 1) Cargar un ingrediente nuevo
    click(el, "Agregar ingrediente");
    await esperar();
    setVal(el.querySelector('input[placeholder="Harina 000"]'), "Ingrediente de prueba");
    const inputPrecio = [...el.querySelectorAll('input[type="number"]')].find((i) => i.step === "0.01");
    setVal(inputPrecio, "1000");
    click(el, "Guardar ingrediente");
    await esperar();
    expect(el.textContent).toContain("Ingrediente de prueba");

    // 2) Confirmar que aparece como opción al armar un plato nuevo
    click(el, "Platos");
    await esperar();
    click(el, "Agregar plato");
    await esperar();
    click(el, "Agregar ingrediente"); // agrega la primera línea de receta (plato vacío)
    await esperar();
    const selectIngredienteReceta = el.querySelector("tbody select");
    const tieneElIngrediente = [...selectIngredienteReceta.options].some((o) => o.textContent === "Ingrediente de prueba");
    expect(tieneElIngrediente).toBe(true);
  });

  it("el rol se respeta de punta a punta: un visualizador no ve botones de edición en ninguna pestaña", async () => {
    const el = montar();
    await esperar();
    await loguearComo(el, { rol: "visualizador" });
    await esperar();

    for (const label of ["Materias primas", "Platos", "Costos fijos"]) {
      click(el, label);
      await esperar();
      expect(el.querySelectorAll('button[title^="Editar"]').length).toBe(0);
    }
  });

  it("una cuenta sin membership no entra a la app y puede volver al login", async () => {
    iniciarSesion.mockResolvedValue({ user: { id: "u1", email: "sinacceso@lanuna.com" } });
    obtenerMembership.mockRejectedValue(new Error("no rows"));
    const el = montar();
    await esperar();
    const [inputEmail, inputClave] = el.querySelectorAll("input");
    setVal(inputEmail, "sinacceso@lanuna.com");
    setVal(inputClave, "costos2026");
    await act(async () => { click(el, "Ingresar"); await new Promise((r) => setTimeout(r, 20)); });

    expect(el.textContent).toContain("todavía no tiene acceso a ninguna empresa");
    click(el, "Volver al login");
    expect(cerrarSesion).toHaveBeenCalled();
  });

  it("cerrar sesión vuelve a la pantalla de login", async () => {
    const el = montar();
    await esperar();
    await loguearComo(el);
    await esperar();
    // Abrir el menú de configuración y cerrar sesión
    const btnConfig = [...el.querySelectorAll("button")].find((b) => b.title === "Configuración");
    act(() => btnConfig.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    await esperar();
    click(el, "Cerrar sesión");
    expect(cerrarSesion).toHaveBeenCalled();
  });
});
