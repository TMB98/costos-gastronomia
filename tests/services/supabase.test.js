import { describe, it, expect, vi, beforeEach } from "vitest";
import { dbLeer, dbGuardar, dbConfigurada } from "../../src/services/supabase.js";

// Nota: dbConfigurada se calcula una sola vez al importar el módulo, a partir
// de las credenciales hardcodeadas en supabase.js. En este proyecto esas
// credenciales SIEMPRE están presentes (por diseño — ver ARCHITECTURE.md),
// así que no podemos probar acá el camino "sin Supabase configurado" sin
// cambiar la forma del módulo. Lo que sí probamos a fondo es que, estando
// configurado, arma las peticiones exactamente como espera Supabase.

describe("dbConfigurada", () => {
  it("es true porque las credenciales están cargadas", () => {
    expect(dbConfigurada).toBe(true);
  });
});

describe("dbLeer", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it("hace GET a la URL correcta, con los headers de autenticación correctos", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => [{ payload: { ingredientes: [] } }],
    });
    const resultado = await dbLeer();
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toContain("/rest/v1/datos_app");
    expect(url).toContain("id=eq.principal");
    expect(opts.headers.apikey).toBeTruthy();
    expect(opts.headers.Authorization).toBe(`Bearer ${opts.headers.apikey}`);
    expect(resultado).toEqual({ ingredientes: [] });
  });

  it("si la tabla está vacía (sin filas), devuelve null en vez de romper", async () => {
    global.fetch.mockResolvedValue({ ok: true, json: async () => [] });
    expect(await dbLeer()).toBeNull();
  });

  it("si Supabase responde con error HTTP, tira una excepción clara", async () => {
    global.fetch.mockResolvedValue({ ok: false });
    await expect(dbLeer()).rejects.toThrow("No se pudo leer la base de datos");
  });
});

describe("dbGuardar", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it("hace POST con upsert (merge-duplicates) para no duplicar la fila", async () => {
    global.fetch.mockResolvedValue({ ok: true });
    const datosFalsos = { ingredientes: [{ id: "i1" }] };
    const ok = await dbGuardar(datosFalsos);
    expect(ok).toBe(true);
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toContain("/rest/v1/datos_app");
    expect(opts.method).toBe("POST");
    expect(opts.headers.Prefer).toContain("merge-duplicates");
    const body = JSON.parse(opts.body);
    expect(body.id).toBe("principal");
    expect(body.payload).toEqual(datosFalsos);
    expect(body.actualizado_en).toBeTruthy();
  });

  it("si Supabase responde con error, devuelve false (no rompe la app)", async () => {
    global.fetch.mockResolvedValue({ ok: false });
    expect(await dbGuardar({})).toBe(false);
  });
});
