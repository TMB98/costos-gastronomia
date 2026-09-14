import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { useEnLinea } from "../../src/lib/useEnLinea.js";

function ComponentePrueba() {
  const enLinea = useEnLinea();
  return <span data-testid="estado">{enLinea ? "online" : "offline"}</span>;
}

function montar() {
  const contenedor = document.createElement("div");
  document.body.appendChild(contenedor);
  const root = createRoot(contenedor);
  act(() => { root.render(<ComponentePrueba />); });
  return contenedor;
}

describe("useEnLinea", () => {
  let valorOriginalOnLine;

  beforeEach(() => {
    valorOriginalOnLine = navigator.onLine;
  });
  afterEach(() => {
    Object.defineProperty(navigator, "onLine", { value: valorOriginalOnLine, configurable: true });
  });

  it("arranca reflejando navigator.onLine", () => {
    Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
    const el = montar();
    expect(el.textContent).toBe("online");
  });

  it("pasa a 'offline' cuando el navegador dispara el evento 'offline'", () => {
    Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
    const el = montar();
    act(() => { window.dispatchEvent(new Event("offline")); });
    expect(el.textContent).toBe("offline");
  });

  it("vuelve a 'online' cuando el navegador dispara el evento 'online'", () => {
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
    const el = montar();
    expect(el.textContent).toBe("offline");
    act(() => { window.dispatchEvent(new Event("online")); });
    expect(el.textContent).toBe("online");
  });
});
