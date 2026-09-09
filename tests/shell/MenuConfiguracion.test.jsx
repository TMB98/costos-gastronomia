import { describe, it, expect, vi } from "vitest";
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import MenuConfiguracion from "../../src/shell/MenuConfiguracion.jsx";
import { RolContext } from "../../src/auth/usuarios.js";

function montarConRol(rol, props = {}) {
  const contenedor = document.createElement("div");
  document.body.appendChild(contenedor);
  const root = createRoot(contenedor);
  const propsPorDefecto = {
    data: { ingredientes: [], platos: [], costosFijos: [], config: {} },
    setData: () => {},
    toast: () => {},
    setConfirmar: () => {},
    oscuro: false,
    setOscuro: () => {},
    usuarioActual: "test",
    onCerrarSesion: () => {},
  };
  act(() => {
    root.render(
      <RolContext.Provider value={rol}>
        <MenuConfiguracion {...propsPorDefecto} {...props} />
      </RolContext.Provider>
    );
  });
  return contenedor;
}

function abrirMenu(el) {
  const btn = el.querySelector('button[title="Configuración"]');
  act(() => btn.dispatchEvent(new MouseEvent("click", { bubbles: true })));
}

describe("MenuConfiguracion: visibilidad por rol", () => {
  it("admin ve \"Restaurar ejemplo\" y \"Restaurar respaldo\"", () => {
    const el = montarConRol("admin");
    abrirMenu(el);
    expect(el.textContent).toContain("Restaurar ejemplo");
    expect(el.textContent).toContain("Restaurar respaldo");
  });

  it("visualizador NO ve \"Restaurar ejemplo\" ni \"Restaurar respaldo\", y muestra el badge de solo lectura", () => {
    const el = montarConRol("visualizador");
    abrirMenu(el);
    expect(el.textContent).not.toContain("Restaurar ejemplo");
    expect(el.textContent).not.toContain("Restaurar respaldo");
    expect(el.textContent).toContain("solo lectura");
  });

  it("cajero NO ve \"Restaurar ejemplo\" ni \"Restaurar respaldo\", y muestra el badge de cajero", () => {
    const el = montarConRol("cajero");
    abrirMenu(el);
    expect(el.textContent).not.toContain("Restaurar ejemplo");
    expect(el.textContent).not.toContain("Restaurar respaldo");
    expect(el.textContent).toContain("cajero — solo Ventas");
  });

  it("todos los roles ven \"Descargar respaldo\" y \"Cerrar sesión\" (son de solo lectura o afectan solo la sesión propia)", () => {
    ["admin", "cajero", "visualizador"].forEach((rol) => {
      const el = montarConRol(rol);
      abrirMenu(el);
      expect(el.textContent).toContain("Descargar respaldo");
      expect(el.textContent).toContain("Cerrar sesión");
    });
  });

  it("\"Cerrar sesión\" llama a onCerrarSesion", () => {
    const onCerrarSesion = vi.fn();
    const el = montarConRol("admin", { onCerrarSesion });
    abrirMenu(el);
    const btn = [...el.querySelectorAll("button")].find((b) => b.textContent.includes("Cerrar sesión"));
    act(() => btn.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(onCerrarSesion).toHaveBeenCalledTimes(1);
  });

  it("muestra el usuario conectado", () => {
    const el = montarConRol("admin", { usuarioActual: "juani" });
    abrirMenu(el);
    expect(el.textContent).toContain("juani");
  });

  it("abrir el manual de usuario funciona", () => {
    const el = montarConRol("admin");
    abrirMenu(el);
    const btnManual = [...el.querySelectorAll("button")].find((b) => b.textContent.includes("Manual de usuario"));
    act(() => btnManual.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(el.textContent).toContain("¿Qué es esta app y por dónde arranco?");
  });
});
