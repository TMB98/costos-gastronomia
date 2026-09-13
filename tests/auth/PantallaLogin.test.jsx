import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import PantallaLogin from "../../src/auth/PantallaLogin.jsx";
import { iniciarSesion } from "../../src/services/supabase.js";

// PantallaLogin delega la autenticación real en services/supabase.js
// (Supabase Auth con email/contraseña) — acá mockeamos esa función para
// no depender de red ni de credenciales reales.
vi.mock("../../src/services/supabase.js", () => ({
  iniciarSesion: vi.fn(),
}));

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

async function esperar() {
  await act(async () => { await Promise.resolve(); await Promise.resolve(); });
}

describe("PantallaLogin", () => {
  beforeEach(() => {
    localStorage.clear();
    iniciarSesion.mockReset();
  });

  it("con email y contraseña correctos, llama a onIngresar con la sesión de Supabase", async () => {
    const sesionFalsa = { user: { id: "u1", email: "juani@lanuna.com" } };
    iniciarSesion.mockResolvedValue(sesionFalsa);
    const onIngresar = vi.fn();
    const el = montar(<PantallaLogin onIngresar={onIngresar} />);
    const [inputEmail, inputClave] = el.querySelectorAll("input");
    setVal(inputEmail, "juani@lanuna.com");
    setVal(inputClave, "costos2026");
    const btn = [...el.querySelectorAll("button")].find((b) => b.textContent.trim() === "Ingresar");
    await act(async () => { btn.dispatchEvent(new MouseEvent("click", { bubbles: true })); await esperar(); });

    expect(iniciarSesion).toHaveBeenCalledWith("juani@lanuna.com", "costos2026");
    expect(onIngresar).toHaveBeenCalledWith(sesionFalsa);
  });

  it("con contraseña incorrecta, NO llama a onIngresar y muestra el error", async () => {
    iniciarSesion.mockRejectedValue(new Error("Invalid login credentials"));
    const onIngresar = vi.fn();
    const el = montar(<PantallaLogin onIngresar={onIngresar} />);
    const [inputEmail, inputClave] = el.querySelectorAll("input");
    setVal(inputEmail, "juani@lanuna.com");
    setVal(inputClave, "clave-mal");
    const btn = [...el.querySelectorAll("button")].find((b) => b.textContent.trim() === "Ingresar");
    await act(async () => { btn.dispatchEvent(new MouseEvent("click", { bubbles: true })); await esperar(); });

    expect(onIngresar).not.toHaveBeenCalled();
    expect(el.textContent).toContain("Usuario o contraseña incorrectos");
  });

  it("mientras espera la respuesta de Supabase, deshabilita el botón y muestra 'Ingresando…'", async () => {
    let resolver;
    iniciarSesion.mockReturnValue(new Promise((r) => { resolver = r; }));
    const el = montar(<PantallaLogin onIngresar={() => {}} />);
    const [inputEmail, inputClave] = el.querySelectorAll("input");
    setVal(inputEmail, "juani@lanuna.com");
    setVal(inputClave, "costos2026");
    const btn = [...el.querySelectorAll("button")].find((b) => b.textContent.trim() === "Ingresar" || b.textContent.trim() === "Ingresando…");
    act(() => btn.dispatchEvent(new MouseEvent("click", { bubbles: true })));

    expect(btn.disabled).toBe(true);
    expect(btn.textContent).toBe("Ingresando…");
    await act(async () => { resolver({ user: { id: "u1" } }); await esperar(); });
  });

  it("no intenta loguearse si falta el email o la contraseña", () => {
    const onIngresar = vi.fn();
    const el = montar(<PantallaLogin onIngresar={onIngresar} />);
    const btn = [...el.querySelectorAll("button")].find((b) => b.textContent.trim() === "Ingresar");
    act(() => btn.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(iniciarSesion).not.toHaveBeenCalled();
  });

  it("presionar Enter en el campo de contraseña también confirma el login", async () => {
    iniciarSesion.mockResolvedValue({ user: { id: "u1" } });
    const onIngresar = vi.fn();
    const el = montar(<PantallaLogin onIngresar={onIngresar} />);
    const [inputEmail, inputClave] = el.querySelectorAll("input");
    setVal(inputEmail, "juani@lanuna.com");
    setVal(inputClave, "costos2026");
    await act(async () => {
      inputClave.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      await esperar();
    });
    expect(iniciarSesion).toHaveBeenCalledTimes(1);
  });

  it("el ojito alterna entre ocultar y mostrar la contraseña", () => {
    const el = montar(<PantallaLogin onIngresar={() => {}} />);
    const inputClave = el.querySelectorAll("input")[1];
    expect(inputClave.type).toBe("password");
    const btnOjo = el.querySelector('button[title="Mostrar contraseña"]');
    act(() => btnOjo.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(el.querySelectorAll("input")[1].type).toBe("text");
  });

  it("el botón de ingresar NO es type=submit (evita el bloqueo de forms en sandboxes)", () => {
    const el = montar(<PantallaLogin onIngresar={() => {}} />);
    expect(el.querySelectorAll("form")).toHaveLength(0);
    const btn = [...el.querySelectorAll("button")].find((b) => b.textContent.trim() === "Ingresar");
    expect(btn.getAttribute("type")).toBe("button");
  });
});
