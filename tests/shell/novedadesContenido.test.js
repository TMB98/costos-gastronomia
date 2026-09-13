import { describe, it, expect } from "vitest";
import NOVEDADES from "../../src/shell/novedadesContenido.js";
import { APP_VERSION } from "../../src/config/constants.js";

// El changelog in-app y APP_VERSION se actualizan a mano juntos (ver
// PROJECT_CONTEXT.md, punto 15) — este test es la red de seguridad para que
// no se desincronicen si alguna vez alguien sube uno y se olvida del otro.
describe("Changelog in-app vs APP_VERSION", () => {
  it("la primera entrada del changelog es la versión actual de la app", () => {
    expect(NOVEDADES[0].version).toBe(APP_VERSION);
  });

  it("las versiones están en orden descendente (la más nueva primero)", () => {
    const versiones = NOVEDADES.map((n) => n.version);
    const ordenadas = [...versiones].sort((a, b) =>
      b.localeCompare(a, undefined, { numeric: true })
    );
    expect(versiones).toEqual(ordenadas);
  });

  it("cada entrada tiene al menos un ítem de novedad", () => {
    NOVEDADES.forEach((n) => {
      expect(n.items.length).toBeGreaterThan(0);
    });
  });
});
