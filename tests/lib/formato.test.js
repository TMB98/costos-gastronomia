import { describe, it, expect } from "vitest";
import { $, $0, pct1, fechaCorta, uid } from "../../src/lib/formato.js";

describe("formato de moneda", () => {
  it("$ formatea con 2 decimales", () => {
    expect($(1234.5)).toBe("$1.234,50");
  });
  it("$0 formatea sin decimales, redondeando", () => {
    expect($0(1234.5)).toBe("$1.235");
  });
  it("valores null/NaN devuelven guión, no \"NaN\"", () => {
    expect($(null)).toBe("—");
    expect($(NaN)).toBe("—");
    expect($0(undefined)).toBe("—");
  });
});

describe("pct1", () => {
  it("formatea con coma decimal (es-AR), no punto", () => {
    expect(pct1(65.4)).toBe("65,4%");
  });
  it("valores inválidos o infinitos devuelven guión", () => {
    expect(pct1(null)).toBe("—");
    expect(pct1(Infinity)).toBe("—");
  });
});

describe("fechaCorta", () => {
  it("convierte ISO (YYYY-MM-DD) a formato argentino (DD/MM/YYYY)", () => {
    expect(fechaCorta("2026-09-07")).toBe("07/09/2026");
  });
  it("fecha vacía/null devuelve guión", () => {
    expect(fechaCorta(null)).toBe("—");
    expect(fechaCorta("")).toBe("—");
  });
});

describe("uid", () => {
  it("genera ids únicos con el prefijo pedido", () => {
    const a = uid("ing");
    const b = uid("ing");
    expect(a).not.toBe(b);
    expect(a.startsWith("ing_")).toBe(true);
  });
});
