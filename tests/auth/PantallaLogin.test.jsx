import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import PantallaLogin from "../../src/auth/PantallaLogin.jsx";

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

describe("PantallaLogin", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("con usuario y contraseña correctos, llama a onIngresar con los datos del usuario", () => {
    const onIngresar = vi.fn();
    const el = montar(<PantallaLogin onIngresar={onIngresar} />);
    const [inputUsuario, inputClave] = el.querySelectorAll("input");
    setVal(inputUsuario, "juani");
    setVal(inputClave, "costos2026");
    const btn = [...el.querySelectorAll("button")].find((b) => b.textContent.trim() === "Ingresar");
    act(() => btn.dispatchEvent(new MouseEvent("click", { bubbles: true })));

    expect(onIngresar).toHaveBeenCalledTimes(1);
    expect(onIngresar.mock.calls[0][0]).toMatchObject({ usuario: "juani", rol: "admin" });
  });

  it("con contraseña incorrecta, NO llama a onIngresar y muestra el error", () => {
    const onIngresar = vi.fn();
    const el = montar(<PantallaLogin onIngresar={onIngresar} />);
    const [inputUsuario, inputClave] = el.querySelectorAll("input");
    setVal(inputUsuario, "juani");
    setVal(inputClave, "clave-mal");
    const btn = [...el.querySelectorAll("button")].find((b) => b.textContent.trim() === "Ingresar");
    act(() => btn.dispatchEvent(new MouseEvent("click", { bubbles: true })));

    expect(onIngresar).not.toHaveBeenCalled();
    expect(el.textContent).toContain("Usuario o contraseña incorrectos");
  });

  it("reconoce a un usuario cajero con su rol correcto", () => {
    const onIngresar = vi.fn();
    const el = montar(<PantallaLogin onIngresar={onIngresar} />);
    const [inputUsuario, inputClave] = el.querySelectorAll("input");
    setVal(inputUsuario, "pastelera");
    setVal(inputClave, "Caja2026a");
    const btn = [...el.querySelectorAll("button")].find((b) => b.textContent.trim() === "Ingresar");
    act(() => btn.dispatchEvent(new MouseEvent("click", { bubbles: true })));

    expect(onIngresar.mock.calls[0][0]).toMatchObject({ usuario: "pastelera", rol: "cajero" });
  });

  it("el usuario no distingue mayúsculas/minúsculas", () => {
    const onIngresar = vi.fn();
    const el = montar(<PantallaLogin onIngresar={onIngresar} />);
    const [inputUsuario, inputClave] = el.querySelectorAll("input");
    setVal(inputUsuario, "JUANI");
    setVal(inputClave, "costos2026");
    const btn = [...el.querySelectorAll("button")].find((b) => b.textContent.trim() === "Ingresar");
    act(() => btn.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(onIngresar).toHaveBeenCalledTimes(1);
  });

  it("presionar Enter en el campo de contraseña también confirma el login", () => {
    const onIngresar = vi.fn();
    const el = montar(<PantallaLogin onIngresar={onIngresar} />);
    const [inputUsuario, inputClave] = el.querySelectorAll("input");
    setVal(inputUsuario, "juani");
    setVal(inputClave, "costos2026");
    act(() => inputClave.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })));
    expect(onIngresar).toHaveBeenCalledTimes(1);
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
