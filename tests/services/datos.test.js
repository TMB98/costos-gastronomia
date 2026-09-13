import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeQueryResult } from "../helpers/mockSupabaseClient.js";

// datos.js es la única puerta a Supabase — mockeamos el cliente en el
// límite exacto donde datos.js lo importa, así testeamos la lógica real
// de cada función (qué tabla toca, qué manda, cómo transforma la respuesta)
// sin pegarle a la red.
vi.mock("../../src/services/supabase.js", () => ({
  supabase: { from: vi.fn(), rpc: vi.fn() },
}));

const { supabase } = await import("../../src/services/supabase.js");
const datos = await import("../../src/services/datos.js");

beforeEach(() => {
  supabase.from.mockReset();
  supabase.rpc.mockReset();
});

/* ══════════════ MEMBRESÍA ══════════════ */

describe("obtenerMembership", () => {
  it("junta company_id/rol de 'memberships' con el nombre de 'perfiles'", async () => {
    supabase.from.mockImplementation((tabla) => {
      if (tabla === "memberships") return makeQueryResult({ data: { company_id: "c1", rol: "admin" }, error: null });
      if (tabla === "perfiles") return makeQueryResult({ data: { nombre: "Juani" }, error: null });
      throw new Error(`tabla inesperada: ${tabla}`);
    });
    const resultado = await datos.obtenerMembership("u1");
    expect(resultado).toEqual({ companyId: "c1", rol: "admin", nombre: "Juani" });
  });

  it("si no hay fila en 'memberships', tira el error de Supabase (sin membership → sin acceso)", async () => {
    supabase.from.mockImplementation((tabla) => {
      if (tabla === "memberships") return makeQueryResult({ data: null, error: new Error("no rows") });
      return makeQueryResult({ data: null, error: null });
    });
    await expect(datos.obtenerMembership("u-sin-empresa")).rejects.toThrow("no rows");
  });

  it("si 'perfiles' no tiene fila (maybeSingle → null), el nombre queda undefined sin romper", async () => {
    supabase.from.mockImplementation((tabla) => {
      if (tabla === "memberships") return makeQueryResult({ data: { company_id: "c1", rol: "cajero" }, error: null });
      if (tabla === "perfiles") return makeQueryResult({ data: null, error: null });
      throw new Error(`tabla inesperada: ${tabla}`);
    });
    const resultado = await datos.obtenerMembership("u2");
    expect(resultado).toEqual({ companyId: "c1", rol: "cajero", nombre: undefined });
  });
});

/* ══════════════ CARGA INICIAL ══════════════ */

describe("cargarTodo", () => {
  function tablasCompletas() {
    return {
      ingredientes: makeQueryResult({ data: [{ id: "i1", nombre: "Harina", categoria: "Secos", unidad: "kg", precio: 1200, proveedor: "Molino", fecha_precio: "2026-08-01" }], error: null }),
      historial_precios: makeQueryResult({ data: [{ ingrediente_id: "i1", fecha: "2026-08-01", precio: 1200 }], error: null }),
      platos: makeQueryResult({ data: [{ id: "p1", nombre: "Torta", categoria: "Postres", descripcion: "", foto: null, porciones: 8, tiempo: 60, notas: "", precio_venta: 5000, unidades_estimadas: 10 }], error: null }),
      plato_ingredientes: makeQueryResult({ data: [{ id: "pi1", plato_id: "p1", ingrediente_id: "i1", cantidad: 0.5, unidad: "kg" }], error: null }),
      costos_fijos: makeQueryResult({ data: [{ id: "cf1", nombre: "Alquiler", categoria: "Fijo", monto: 100000, frecuencia: "mensual", notas: "", proximo_ajuste: null }], error: null }),
      pedidos: makeQueryResult({ data: [{ id: "ped1", fecha: "2026-09-01", medio_pago: "efectivo" }], error: null }),
      venta_items: makeQueryResult({ data: [{ id: "v1", pedido_id: "ped1", plato_id: "p1", plato_nombre: "Torta", cantidad: 2, precio_unitario: 5000, costo_unitario: 2000, notas: "" }], error: null }),
      correcciones_ventas: makeQueryResult({ data: [{ id: "corr1", fecha: "2026-09-02", hora: "10:00", usuario_id: "u1", pedido_id: "ped-viejo", motivo: "error de carga", items_snapshot: [], total: 1000 }], error: null }),
      categorias: makeQueryResult({ data: [{ tipo: "ingrediente", nombre: "Secos" }, { tipo: "plato", nombre: "Postres" }], error: null }),
      benchmarks: makeQueryResult({ data: [{ id: "b1", nombre: "Margen", min: 60, max: 70, mejor_es: "alto" }], error: null }),
      configuracion: makeQueryResult({
        data: {
          margen_objetivo: 65, iva: 21, precios_incluyen_iva: true, modo_prorrateo: "unidades",
          horas_por_dia: 10, dias_por_mes: 30, tema_oscuro: false, ocultar_checklist: false,
          ayuda_colapsada: {}, novedades_vistas: [],
        },
        error: null,
      }),
      perfiles: makeQueryResult({ data: [{ id: "u1", nombre: "Juani" }], error: null }),
    };
  }

  it("junta las 12 tablas y arma el objeto de datos como lo espera la UI", async () => {
    const tablas = tablasCompletas();
    supabase.from.mockImplementation((tabla) => {
      if (!tablas[tabla]) throw new Error(`tabla no mockeada: ${tabla}`);
      return tablas[tabla];
    });

    const resultado = await datos.cargarTodo("c1");

    expect(resultado.ingredientes).toEqual([
      { id: "i1", nombre: "Harina", categoria: "Secos", unidad: "kg", precio: 1200, proveedor: "Molino", fechaPrecio: "2026-08-01", historial: [{ fecha: "2026-08-01", precio: 1200 }] },
    ]);
    expect(resultado.platos[0]).toMatchObject({ id: "p1", nombre: "Torta", precioVenta: 5000, items: [{ id: "pi1", ingId: "i1", cantidad: 0.5, unidad: "kg" }] });
    expect(resultado.costosFijos[0]).toMatchObject({ id: "cf1", nombre: "Alquiler", proximoAjuste: null });
    expect(resultado.ventas).toEqual([
      { id: "v1", pedidoId: "ped1", fecha: "2026-09-01", medioPago: "efectivo", platoId: "p1", platoNombre: "Torta", cantidad: 2, precioUnitario: 5000, costoUnitario: 2000, notas: "" },
    ]);
    // El nombre de quién hizo la corrección viene de 'perfiles', cruzado a mano en JS (no hay FK directa)
    expect(resultado.correccionesVentas[0]).toMatchObject({ usuario: "Juani", motivo: "error de carga" });
    expect(resultado.config).toMatchObject({
      margenObjetivo: 65, iva: 21, categoriasIngredientes: ["Secos"], categoriasPlatos: ["Postres"],
      unidades: { p1: 10 }, benchmarks: [{ id: "b1", nombre: "Margen", min: 60, max: 70, mejorEs: "alto" }],
    });
  });

  it("si una corrección de venta apunta a un usuario sin fila en 'perfiles', muestra '—' en vez de romper", async () => {
    const tablas = tablasCompletas();
    tablas.perfiles = makeQueryResult({ data: [], error: null }); // nadie en perfiles
    supabase.from.mockImplementation((tabla) => tablas[tabla]);
    const resultado = await datos.cargarTodo("c1");
    expect(resultado.correccionesVentas[0].usuario).toBe("—");
  });

  it("si cualquiera de las 12 consultas falla, cargarTodo tira ese error", async () => {
    const tablas = tablasCompletas();
    tablas.platos = makeQueryResult({ data: null, error: new Error("timeout de red") });
    supabase.from.mockImplementation((tabla) => tablas[tabla]);
    await expect(datos.cargarTodo("c1")).rejects.toThrow("timeout de red");
  });
});

/* ══════════════ INGREDIENTES ══════════════ */

describe("crearIngrediente", () => {
  it("inserta el ingrediente y, si trae historial, también las filas de historial_precios", async () => {
    const ingredientesResult = makeQueryResult({ error: null });
    const historialResult = makeQueryResult({ error: null });
    supabase.from.mockImplementation((tabla) => (tabla === "ingredientes" ? ingredientesResult : historialResult));

    await datos.crearIngrediente("c1", {
      id: "i1", nombre: "Harina", categoria: "Secos", unidad: "kg", precio: 1200,
      proveedor: "Molino", fechaPrecio: "2026-08-01", historial: [{ fecha: "2026-08-01", precio: 1200 }],
    });

    expect(ingredientesResult.insert).toHaveBeenCalledWith(expect.objectContaining({ id: "i1", company_id: "c1", nombre: "Harina" }));
    expect(historialResult.insert).toHaveBeenCalledWith([{ ingrediente_id: "i1", fecha: "2026-08-01", precio: 1200 }]);
  });

  it("si no trae historial, no toca historial_precios", async () => {
    const ingredientesResult = makeQueryResult({ error: null });
    const historialResult = makeQueryResult({ error: null });
    supabase.from.mockImplementation((tabla) => (tabla === "ingredientes" ? ingredientesResult : historialResult));

    await datos.crearIngrediente("c1", { id: "i1", nombre: "Sal", historial: [] });
    expect(historialResult.insert).not.toHaveBeenCalled();
  });

  it("si falla el insert de ingredientes, tira el error y no intenta guardar historial", async () => {
    const ingredientesResult = makeQueryResult({ error: new Error("nombre duplicado") });
    const historialResult = makeQueryResult({ error: null });
    supabase.from.mockImplementation((tabla) => (tabla === "ingredientes" ? ingredientesResult : historialResult));

    await expect(datos.crearIngrediente("c1", { id: "i1", historial: [{ fecha: "x", precio: 1 }] })).rejects.toThrow("nombre duplicado");
    expect(historialResult.insert).not.toHaveBeenCalled();
  });
});

describe("actualizarIngrediente", () => {
  it("actualiza la fila y hace upsert del último precio del historial", async () => {
    const ingredientesResult = makeQueryResult({ error: null });
    const historialResult = makeQueryResult({ error: null });
    supabase.from.mockImplementation((tabla) => (tabla === "ingredientes" ? ingredientesResult : historialResult));

    await datos.actualizarIngrediente({ id: "i1", nombre: "Harina 000", historial: [{ fecha: "2026-08-01", precio: 1200 }, { fecha: "2026-09-01", precio: 1300 }] });

    expect(ingredientesResult.update).toHaveBeenCalledWith(expect.objectContaining({ nombre: "Harina 000" }));
    expect(ingredientesResult.eq).toHaveBeenCalledWith("id", "i1");
    expect(historialResult.upsert).toHaveBeenCalledWith(
      { ingrediente_id: "i1", fecha: "2026-09-01", precio: 1300 },
      { onConflict: "ingrediente_id,fecha" }
    );
  });

  it("si no hay historial, no hace upsert", async () => {
    const historialResult = makeQueryResult({ error: null });
    supabase.from.mockImplementation((tabla) => (tabla === "ingredientes" ? makeQueryResult({ error: null }) : historialResult));
    await datos.actualizarIngrediente({ id: "i1", historial: [] });
    expect(historialResult.upsert).not.toHaveBeenCalled();
  });

  it("si falla el update, tira el error", async () => {
    supabase.from.mockReturnValue(makeQueryResult({ error: new Error("fila no encontrada") }));
    await expect(datos.actualizarIngrediente({ id: "i-inexistente", historial: [] })).rejects.toThrow("fila no encontrada");
  });
});

describe("borrarIngrediente", () => {
  it("borra la fila cuando no hay conflicto", async () => {
    const result = makeQueryResult({ error: null });
    supabase.from.mockReturnValue(result);
    await datos.borrarIngrediente("i1");
    expect(result.delete).toHaveBeenCalled();
    expect(result.eq).toHaveBeenCalledWith("id", "i1");
  });

  it("si la base bloquea el borrado (23503, en uso en una receta), traduce el error a un mensaje legible", async () => {
    supabase.from.mockReturnValue(makeQueryResult({ error: { code: "23503", message: "foreign key violation" } }));
    await expect(datos.borrarIngrediente("i1")).rejects.toThrow("se usa en una o más recetas");
  });

  it("cualquier otro error de Supabase se relanza tal cual", async () => {
    supabase.from.mockReturnValue(makeQueryResult({ error: { code: "500", message: "error interno" } }));
    await expect(datos.borrarIngrediente("i1")).rejects.toMatchObject({ message: "error interno" });
  });
});

describe("aplicarPreciosMasivo", () => {
  it("llama al RPC 'aplicar_precios_masivo' con los cambios y la fecha", async () => {
    supabase.rpc.mockResolvedValue({ error: null });
    const cambios = [{ ingredienteId: "i1", precio: 1300 }];
    await datos.aplicarPreciosMasivo(cambios, "2026-09-13");
    expect(supabase.rpc).toHaveBeenCalledWith("aplicar_precios_masivo", { p_cambios: cambios, p_fecha: "2026-09-13" });
  });

  it("si el RPC falla, tira el error", async () => {
    supabase.rpc.mockResolvedValue({ error: new Error("función no encontrada") });
    await expect(datos.aplicarPreciosMasivo([], "2026-09-13")).rejects.toThrow("función no encontrada");
  });
});

/* ══════════════ PLATOS ══════════════ */

describe("crearPlato", () => {
  it("inserta el plato y guarda su receta (borra líneas viejas, inserta las nuevas)", async () => {
    const platosResult = makeQueryResult({ error: null });
    const recetaResult = makeQueryResult({ error: null });
    supabase.from.mockImplementation((tabla) => (tabla === "platos" ? platosResult : recetaResult));

    await datos.crearPlato("c1", { id: "p1", nombre: "Torta", precioVenta: 5000, items: [{ id: "pi1", ingId: "i1", cantidad: 1, unidad: "kg" }] });

    expect(platosResult.insert).toHaveBeenCalledWith(expect.objectContaining({ id: "p1", company_id: "c1", nombre: "Torta", precio_venta: 5000 }));
    expect(recetaResult.delete).toHaveBeenCalled();
    expect(recetaResult.eq).toHaveBeenCalledWith("plato_id", "p1");
    expect(recetaResult.insert).toHaveBeenCalledWith([{ id: "pi1", plato_id: "p1", ingrediente_id: "i1", cantidad: 1, unidad: "kg" }]);
  });

  it("un plato sin items borra la receta vieja pero no inserta nada nuevo", async () => {
    const recetaResult = makeQueryResult({ error: null });
    supabase.from.mockImplementation((tabla) => (tabla === "platos" ? makeQueryResult({ error: null }) : recetaResult));
    await datos.crearPlato("c1", { id: "p1", items: [] });
    expect(recetaResult.insert).not.toHaveBeenCalled();
  });

  it("si falla el insert del plato, no llega a tocar la receta", async () => {
    const recetaResult = makeQueryResult({ error: null });
    supabase.from.mockImplementation((tabla) => (tabla === "platos" ? makeQueryResult({ error: new Error("company_id inválido") }) : recetaResult));
    await expect(datos.crearPlato("c1", { id: "p1", items: [] })).rejects.toThrow("company_id inválido");
    expect(recetaResult.delete).not.toHaveBeenCalled();
  });
});

describe("actualizarPlato", () => {
  it("actualiza los campos del plato y regrabra la receta completa", async () => {
    const platosResult = makeQueryResult({ error: null });
    const recetaResult = makeQueryResult({ error: null });
    supabase.from.mockImplementation((tabla) => (tabla === "platos" ? platosResult : recetaResult));

    await datos.actualizarPlato({ id: "p1", nombre: "Torta de chocolate", items: [{ id: "pi2", ingId: "i2", cantidad: 2, unidad: "kg" }] });

    expect(platosResult.update).toHaveBeenCalledWith(expect.objectContaining({ nombre: "Torta de chocolate" }));
    expect(platosResult.eq).toHaveBeenCalledWith("id", "p1");
    expect(recetaResult.insert).toHaveBeenCalledWith([{ id: "pi2", plato_id: "p1", ingrediente_id: "i2", cantidad: 2, unidad: "kg" }]);
  });
});

describe("borrarPlato", () => {
  it("borra la fila de 'platos'", async () => {
    const result = makeQueryResult({ error: null });
    supabase.from.mockReturnValue(result);
    await datos.borrarPlato("p1");
    expect(result.delete).toHaveBeenCalled();
    expect(result.eq).toHaveBeenCalledWith("id", "p1");
  });

  it("si falla, tira el error", async () => {
    supabase.from.mockReturnValue(makeQueryResult({ error: new Error("no existe") }));
    await expect(datos.borrarPlato("p1")).rejects.toThrow("no existe");
  });
});

describe("actualizarUnidadesEstimadas", () => {
  it("actualiza unidades_estimadas del plato correcto", async () => {
    const result = makeQueryResult({ error: null });
    supabase.from.mockReturnValue(result);
    await datos.actualizarUnidadesEstimadas("p1", 25);
    expect(result.update).toHaveBeenCalledWith({ unidades_estimadas: 25 });
    expect(result.eq).toHaveBeenCalledWith("id", "p1");
  });
});

describe("actualizarUnidadesMasivo", () => {
  it("llama al RPC 'actualizar_unidades_masivo' con los cambios", async () => {
    supabase.rpc.mockResolvedValue({ error: null });
    const cambios = [{ platoId: "p1", unidades: 30 }];
    await datos.actualizarUnidadesMasivo(cambios);
    expect(supabase.rpc).toHaveBeenCalledWith("actualizar_unidades_masivo", { p_cambios: cambios });
  });
});

describe("aplicarPreciosPlatosMasivo", () => {
  it("llama al RPC 'aplicar_precios_platos_masivo' con los cambios", async () => {
    supabase.rpc.mockResolvedValue({ error: null });
    const cambios = [{ platoId: "p1", precioVenta: 6000 }];
    await datos.aplicarPreciosPlatosMasivo(cambios);
    expect(supabase.rpc).toHaveBeenCalledWith("aplicar_precios_platos_masivo", { p_cambios: cambios });
  });
});

/* ══════════════ COSTOS FIJOS ══════════════ */

describe("crearCostoFijo / actualizarCostoFijo / borrarCostoFijo", () => {
  it("crearCostoFijo inserta con los campos traducidos a snake_case", async () => {
    const result = makeQueryResult({ error: null });
    supabase.from.mockReturnValue(result);
    await datos.crearCostoFijo("c1", { id: "cf1", nombre: "Alquiler", categoria: "Fijo", monto: 100000, frecuencia: "mensual", notas: "", proximoAjuste: "2026-10-01" });
    expect(result.insert).toHaveBeenCalledWith(expect.objectContaining({ company_id: "c1", proximo_ajuste: "2026-10-01" }));
  });

  it("actualizarCostoFijo actualiza por id", async () => {
    const result = makeQueryResult({ error: null });
    supabase.from.mockReturnValue(result);
    await datos.actualizarCostoFijo({ id: "cf1", nombre: "Alquiler nuevo", monto: 120000 });
    expect(result.update).toHaveBeenCalledWith(expect.objectContaining({ nombre: "Alquiler nuevo", monto: 120000 }));
    expect(result.eq).toHaveBeenCalledWith("id", "cf1");
  });

  it("borrarCostoFijo borra por id", async () => {
    const result = makeQueryResult({ error: null });
    supabase.from.mockReturnValue(result);
    await datos.borrarCostoFijo("cf1");
    expect(result.delete).toHaveBeenCalled();
    expect(result.eq).toHaveBeenCalledWith("id", "cf1");
  });
});

/* ══════════════ VENTAS ══════════════ */

describe("registrarPedido", () => {
  it("llama al RPC 'registrar_pedido' mapeando los items al formato esperado", async () => {
    supabase.rpc.mockResolvedValue({ error: null });
    const items = [{ id: "v1", platoId: "p1", platoNombre: "Torta", cantidad: 2, precioUnitario: 5000, costoUnitario: 2000 }];
    await datos.registrarPedido("c1", "ped1", "2026-09-13", "efectivo", items);
    expect(supabase.rpc).toHaveBeenCalledWith("registrar_pedido", {
      p_pedido_id: "ped1", p_company_id: "c1", p_fecha: "2026-09-13", p_medio_pago: "efectivo",
      p_items: [{ id: "v1", platoId: "p1", platoNombre: "Torta", cantidad: 2, precioUnitario: 5000, costoUnitario: 2000, notas: "" }],
    });
  });

  it("es transaccional: si el RPC falla, tira el error (nada quedó guardado a medias)", async () => {
    supabase.rpc.mockResolvedValue({ error: new Error("stock insuficiente") });
    await expect(datos.registrarPedido("c1", "ped1", "2026-09-13", "efectivo", [])).rejects.toThrow("stock insuficiente");
  });
});

describe("borrarPedido", () => {
  it("llama al RPC 'borrar_pedido' y devuelve el id de la corrección creada", async () => {
    supabase.rpc.mockResolvedValue({ data: "correccion-1", error: null });
    const id = await datos.borrarPedido("ped1", "cliente se arrepintió", "u1");
    expect(supabase.rpc).toHaveBeenCalledWith("borrar_pedido", { p_pedido_id: "ped1", p_motivo: "cliente se arrepintió", p_usuario_id: "u1" });
    expect(id).toBe("correccion-1");
  });

  it("sin motivo, manda cadena vacía en vez de undefined", async () => {
    supabase.rpc.mockResolvedValue({ data: "correccion-2", error: null });
    await datos.borrarPedido("ped1", undefined, "u1");
    expect(supabase.rpc).toHaveBeenCalledWith("borrar_pedido", expect.objectContaining({ p_motivo: "" }));
  });
});

describe("deshacerBorradoPedido", () => {
  it("llama al RPC 'deshacer_borrado_pedido' con el id de la corrección", async () => {
    supabase.rpc.mockResolvedValue({ error: null });
    await datos.deshacerBorradoPedido("correccion-1");
    expect(supabase.rpc).toHaveBeenCalledWith("deshacer_borrado_pedido", { p_correccion_id: "correccion-1" });
  });

  it("si el RPC falla, tira el error", async () => {
    supabase.rpc.mockResolvedValue({ error: new Error("ya fue deshecho antes") });
    await expect(datos.deshacerBorradoPedido("correccion-1")).rejects.toThrow("ya fue deshecho antes");
  });
});

/* ══════════════ CATEGORÍAS, BENCHMARKS, CONFIGURACIÓN ══════════════ */

describe("agregarCategoria", () => {
  it("inserta la categoría con su tipo y empresa", async () => {
    const result = makeQueryResult({ error: null });
    supabase.from.mockReturnValue(result);
    await datos.agregarCategoria("c1", "ingrediente", "Lácteos");
    expect(result.insert).toHaveBeenCalledWith({ company_id: "c1", tipo: "ingrediente", nombre: "Lácteos" });
  });
});

describe("actualizarBenchmark", () => {
  it("actualiza el benchmark indicado con los cambios recibidos", async () => {
    const result = makeQueryResult({ error: null });
    supabase.from.mockReturnValue(result);
    await datos.actualizarBenchmark("b1", { min: 55, max: 65 });
    expect(result.update).toHaveBeenCalledWith({ min: 55, max: 65 });
    expect(result.eq).toHaveBeenCalledWith("id", "b1");
  });
});

describe("actualizarConfiguracion", () => {
  it("traduce las claves de camelCase a las columnas reales de la tabla", async () => {
    const result = makeQueryResult({ error: null });
    supabase.from.mockReturnValue(result);
    await datos.actualizarConfiguracion("c1", { margenObjetivo: 60, temaOscuro: true });
    const payload = result.update.mock.calls[0][0];
    expect(payload.margen_objetivo).toBe(60);
    expect(payload.tema_oscuro).toBe(true);
    expect(payload.updated_at).toBeTruthy();
    expect(result.eq).toHaveBeenCalledWith("company_id", "c1");
  });

  it("ignora claves que no tienen una columna mapeada (no manda basura a Supabase)", async () => {
    const result = makeQueryResult({ error: null });
    supabase.from.mockReturnValue(result);
    await datos.actualizarConfiguracion("c1", { algoQueNoExiste: 123 });
    const payload = result.update.mock.calls[0][0];
    expect(payload).not.toHaveProperty("algoQueNoExiste");
  });
});
