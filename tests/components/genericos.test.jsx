import { describe, it, expect } from "vitest";
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";

import Modal from "../../src/components/Modal.jsx";
import Campo from "../../src/components/Campo.jsx";
import SelectConAgregar from "../../src/components/SelectConAgregar.jsx";
import Boton from "../../src/components/Boton.jsx";
import Tarjeta from "../../src/components/Tarjeta.jsx";
import AyudaSeccion from "../../src/components/AyudaSeccion.jsx";
import ConTooltip from "../../src/components/ConTooltip.jsx";
import Chip from "../../src/components/Chip.jsx";
import KPI from "../../src/components/KPI.jsx";
import Formula from "../../src/components/Formula.jsx";
import BarraH from "../../src/components/graficos/BarraH.jsx";
import PieConLeyenda from "../../src/components/graficos/PieConLeyenda.jsx";
import LineaSVG from "../../src/components/graficos/LineaSVG.jsx";

function montar(elemento) {
  const contenedor = document.createElement("div");
  document.body.appendChild(contenedor);
  const root = createRoot(contenedor);
  act(() => {
    root.render(elemento);
  });
  return contenedor;
}

describe("Componentes genéricos: renderizan de verdad sin tirar error", () => {
  it("Boton renderiza y muestra su texto", () => {
    const el = montar(<Boton>Guardar</Boton>);
    expect(el.textContent).toContain("Guardar");
  });

  it("Chip renderiza con los colores pasados", () => {
    const el = montar(<Chip color="#15803d" bg="#dcfce7">Activo</Chip>);
    expect(el.textContent).toContain("Activo");
  });

  it("KPI muestra label y valor", () => {
    const el = montar(<KPI label="Ganancia" valor="$1.000" detalle="este mes" />);
    expect(el.textContent).toContain("Ganancia");
    expect(el.textContent).toContain("$1.000");
    expect(el.textContent).toContain("este mes");
  });

  it("Tarjeta renderiza título y contenido", () => {
    const el = montar(<Tarjeta titulo="Materias primas"><p>Hola</p></Tarjeta>);
    expect(el.textContent).toContain("Materias primas");
    expect(el.textContent).toContain("Hola");
  });

  it("Campo renderiza label + children", () => {
    const el = montar(<Campo label="Nombre"><input /></Campo>);
    expect(el.textContent).toContain("Nombre");
    expect(el.querySelector("input")).not.toBeNull();
  });

  it("ConTooltip renderiza sus children sin romper", () => {
    const el = montar(<ConTooltip texto="Info"><button>X</button></ConTooltip>);
    expect(el.querySelector("button")).not.toBeNull();
  });

  it("Formula renderiza el texto de la fórmula", () => {
    const el = montar(<Formula>costo / (1 - margen)</Formula>);
    expect(el.textContent).toContain("costo / (1 - margen)");
  });

  it("AyudaSeccion renderiza objetivo y pasos", () => {
    const cfg = { ayudaColapsada: {} };
    const el = montar(
      <AyudaSeccion id="test" objetivo="Cargar datos" pasos={["Paso uno", "Paso dos"]} cfg={cfg} setCfg={() => {}} />
    );
    expect(el.textContent).toContain("Cargar datos");
    expect(el.textContent).toContain("Paso uno");
  });

  it("SelectConAgregar renderiza las opciones", () => {
    const el = montar(
      <SelectConAgregar value="Lácteos" onChange={() => {}} opciones={["Lácteos", "Carnes"]} onAgregarOpcion={() => {}} />
    );
    const select = el.querySelector("select");
    expect(select).not.toBeNull();
    expect(el.textContent).toContain("Lácteos");
  });

  it("Modal renderiza el título y los children, y el botón de cerrar existe", () => {
    const el = montar(<Modal title="Editar plato" onClose={() => {}}><p>Contenido</p></Modal>);
    expect(el.textContent).toContain("Editar plato");
    expect(el.textContent).toContain("Contenido");
    expect(el.querySelector('button[title="Cerrar"]')).not.toBeNull();
  });

  it("BarraH renderiza sin datos ni con datos, sin tirar error", () => {
    expect(() => montar(<BarraH data={[]} />)).not.toThrow();
    expect(() => montar(<BarraH data={[{ name: "A", value: 10 }, { name: "B", value: 20 }]} />)).not.toThrow();
  });

  it("PieConLeyenda renderiza sin tirar error", () => {
    expect(() =>
      montar(<PieConLeyenda data={[{ name: "A", value: 10 }]} paleta={["#1B3A6B", "#2C5296"]} />)
    ).not.toThrow();
  });

  it("LineaSVG renderiza sin tirar error", () => {
    expect(() =>
      montar(
        <LineaSVG
          data={[{ fecha: "2026-01-01", valor: 100 }, { fecha: "2026-02-01", valor: 120 }]}
          valueKey="valor"
          labelKey="fecha"
        />
      )
    ).not.toThrow();
  });
});
