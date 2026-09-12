import { supabase } from "./supabase.js";

/* ══════════════════════════════════════════════════════════════
   MEMBRESÍA — quién sos, en qué empresa, con qué rol
   ══════════════════════════════════════════════════════════════ */
export async function obtenerMembership(userId) {
  const { data, error } = await supabase
    .from("memberships")
    .select("company_id, rol")
    .eq("user_id", userId)
    .single();
  if (error) throw error;
  // El nombre vive en "perfiles" — se busca aparte, no hay una relación
  // directa entre "memberships" y "perfiles" que Supabase pueda cruzar sola
  // (las dos apuntan a auth.users, pero no entre sí).
  const { data: perfil } = await supabase.from("perfiles").select("nombre").eq("id", userId).maybeSingle();
  return { companyId: data.company_id, rol: data.rol, nombre: perfil?.nombre };
}

/* ══════════════════════════════════════════════════════════════
   CARGA INICIAL — junta todo para el primer render, en la misma
   forma que ya espera la app (para que el cutover del paso 5 sea
   chico). Las escrituras, en cambio, van todas targeted abajo.
   ══════════════════════════════════════════════════════════════ */
export async function cargarTodo(companyId) {
  const [ing, hist, pl, pi, cf, ped, vi, cv, cat, bench, cfg] = await Promise.all([
    supabase.from("ingredientes").select("*").eq("company_id", companyId),
    supabase.from("historial_precios").select("ingrediente_id, fecha, precio"),
    supabase.from("platos").select("*").eq("company_id", companyId),
    supabase.from("plato_ingredientes").select("*"),
    supabase.from("costos_fijos").select("*").eq("company_id", companyId),
    supabase.from("pedidos").select("*").eq("company_id", companyId),
    supabase.from("venta_items").select("*"),
    supabase.from("correcciones_ventas").select("*, perfiles(nombre)").eq("company_id", companyId),
    supabase.from("categorias").select("tipo, nombre").eq("company_id", companyId),
    supabase.from("benchmarks").select("*").eq("company_id", companyId),
    supabase.from("configuracion").select("*").eq("company_id", companyId).single(),
  ]);
  for (const r of [ing, hist, pl, pi, cf, ped, vi, cv, cat, bench, cfg]) {
    if (r.error) throw r.error;
  }

  const historialPorIng = {};
  hist.data.forEach((h) => { (historialPorIng[h.ingrediente_id] ??= []).push({ fecha: h.fecha, precio: h.precio }); });

  const itemsPorPlato = {};
  pi.data.forEach((it) => { (itemsPorPlato[it.plato_id] ??= []).push({ id: it.id, ingId: it.ingrediente_id, cantidad: it.cantidad, unidad: it.unidad }); });

  const ingredientes = ing.data.map((i) => ({
    id: i.id, nombre: i.nombre, categoria: i.categoria, unidad: i.unidad, precio: i.precio,
    proveedor: i.proveedor, fechaPrecio: i.fecha_precio, historial: historialPorIng[i.id] || [],
  }));

  const platos = pl.data.map((p) => ({
    id: p.id, nombre: p.nombre, categoria: p.categoria, descripcion: p.descripcion, foto: p.foto,
    porciones: p.porciones, tiempo: p.tiempo, notas: p.notas, precioVenta: p.precio_venta,
    items: itemsPorPlato[p.id] || [],
  }));

  const unidadesPorPlato = Object.fromEntries(pl.data.map((p) => [p.id, p.unidades_estimadas]));

  const itemsPorPedido = {};
  vi.data.forEach((v) => { (itemsPorPedido[v.pedido_id] ??= []).push(v); });
  const ventas = ped.data.flatMap((p) =>
    (itemsPorPedido[p.id] || []).map((v) => ({
      id: v.id, pedidoId: p.id, fecha: p.fecha, medioPago: p.medio_pago,
      platoId: v.plato_id, platoNombre: v.plato_nombre, cantidad: v.cantidad,
      precioUnitario: v.precio_unitario, costoUnitario: v.costo_unitario, notas: v.notas,
    }))
  );

  const correccionesVentas = cv.data.map((c) => ({
    id: c.id, fecha: c.fecha, hora: c.hora, usuario: c.perfiles?.nombre || "—",
    pedidoId: c.pedido_id, motivo: c.motivo, items: c.items_snapshot, total: c.total,
  }));

  const categoriasPorTipo = { ingrediente: [], plato: [], costo: [] };
  cat.data.forEach((c) => categoriasPorTipo[c.tipo]?.push(c.nombre));

  const config = {
    margenObjetivo: cfg.data.margen_objetivo, iva: cfg.data.iva,
    preciosIncluyenIVA: cfg.data.precios_incluyen_iva, modoProrrateo: cfg.data.modo_prorrateo,
    horasPorDia: cfg.data.horas_por_dia, diasPorMes: cfg.data.dias_por_mes,
    temaOscuro: cfg.data.tema_oscuro, ocultarChecklist: cfg.data.ocultar_checklist,
    ayudaColapsada: cfg.data.ayuda_colapsada, novedadesVistas: cfg.data.novedades_vistas,
    categoriasIngredientes: categoriasPorTipo.ingrediente, categoriasPlatos: categoriasPorTipo.plato,
    categoriasCostos: categoriasPorTipo.costo, unidades: unidadesPorPlato,
    benchmarks: bench.data.map((b) => ({ id: b.id, nombre: b.nombre, min: b.min, max: b.max, mejorEs: b.mejor_es })),
  };

  return { ingredientes, platos, costosFijos: cf.data.map(mapCostoFijo), ventas, correccionesVentas, config };
}

const mapCostoFijo = (c) => ({
  id: c.id, nombre: c.nombre, categoria: c.categoria, monto: c.monto,
  frecuencia: c.frecuencia, notas: c.notas, proximoAjuste: c.proximo_ajuste,
});

/* ══════════════════════════════════════════════════════════════
   INGREDIENTES — cada acción toca solo su fila
   ══════════════════════════════════════════════════════════════ */
export async function crearIngrediente(companyId, ing) {
  const { error } = await supabase.from("ingredientes").insert({
    id: ing.id, company_id: companyId, nombre: ing.nombre, categoria: ing.categoria,
    unidad: ing.unidad, precio: ing.precio, proveedor: ing.proveedor, fecha_precio: ing.fechaPrecio,
  });
  if (error) throw error;
  if (ing.historial?.length) {
    const { error: e2 } = await supabase.from("historial_precios").insert(
      ing.historial.map((h) => ({ ingrediente_id: ing.id, fecha: h.fecha, precio: h.precio }))
    );
    if (e2) throw e2;
  }
}

export async function actualizarIngrediente(ing) {
  const { error } = await supabase.from("ingredientes").update({
    nombre: ing.nombre, categoria: ing.categoria, unidad: ing.unidad, precio: ing.precio,
    proveedor: ing.proveedor, fecha_precio: ing.fechaPrecio, updated_at: new Date().toISOString(),
  }).eq("id", ing.id);
  if (error) throw error;
  const nuevo = ing.historial?.[ing.historial.length - 1];
  if (nuevo) {
    const { error: e2 } = await supabase.from("historial_precios")
      .upsert({ ingrediente_id: ing.id, fecha: nuevo.fecha, precio: nuevo.precio }, { onConflict: "ingrediente_id,fecha" });
    if (e2) throw e2;
  }
}

// La base bloquea (ON DELETE RESTRICT) si el ingrediente está en uso — acá
// traducimos ese error de Postgres a algo legible en vez de dejarlo crudo.
export async function borrarIngrediente(id) {
  const { error } = await supabase.from("ingredientes").delete().eq("id", id);
  if (error) {
    if (error.code === "23503") { // foreign_key_violation
      throw new Error("No se puede borrar: este ingrediente se usa en una o más recetas. Sacalo de esas recetas primero.");
    }
    throw error;
  }
}

export async function aplicarPreciosMasivo(cambios, fecha) {
  // cambios: [{ ingredienteId, precio }]
  const { error } = await supabase.rpc("aplicar_precios_masivo", { p_cambios: cambios, p_fecha: fecha });
  if (error) throw error;
}

/* ══════════════════════════════════════════════════════════════
   PLATOS — el plato y su receta se guardan juntos, pero como 2
   escrituras targeted (no como parte de ningún blob más grande)
   ══════════════════════════════════════════════════════════════ */
export async function crearPlato(companyId, p) {
  const { error } = await supabase.from("platos").insert({
    id: p.id, company_id: companyId, nombre: p.nombre, categoria: p.categoria,
    descripcion: p.descripcion, foto: p.foto, porciones: p.porciones, tiempo: p.tiempo,
    notas: p.notas, precio_venta: p.precioVenta, unidades_estimadas: p.unidadesEstimadas || 0,
  });
  if (error) throw error;
  await guardarRecetaPlato(p.id, p.items);
}

export async function actualizarPlato(p) {
  const { error } = await supabase.from("platos").update({
    nombre: p.nombre, categoria: p.categoria, descripcion: p.descripcion, foto: p.foto,
    porciones: p.porciones, tiempo: p.tiempo, notas: p.notas, precio_venta: p.precioVenta,
    updated_at: new Date().toISOString(),
  }).eq("id", p.id);
  if (error) throw error;
  await guardarRecetaPlato(p.id, p.items);
}

// Reemplaza la receta completa: borra las líneas viejas y carga las nuevas.
// Es más simple y menos propenso a error que tratar de calcular un diff.
async function guardarRecetaPlato(platoId, items) {
  const { error: eDel } = await supabase.from("plato_ingredientes").delete().eq("plato_id", platoId);
  if (eDel) throw eDel;
  if (items?.length) {
    const { error: eIns } = await supabase.from("plato_ingredientes").insert(
      items.map((it) => ({ id: it.id, plato_id: platoId, ingrediente_id: it.ingId, cantidad: it.cantidad, unidad: it.unidad }))
    );
    if (eIns) throw eIns;
  }
}

export async function borrarPlato(id) {
  const { error } = await supabase.from("platos").delete().eq("id", id);
  if (error) throw error;
}

export async function actualizarUnidadesEstimadas(platoId, unidades) {
  const { error } = await supabase.from("platos").update({ unidades_estimadas: unidades }).eq("id", platoId);
  if (error) throw error;
}

export async function actualizarUnidadesMasivo(cambios) {
  // cambios: [{ platoId, unidades }]
  const { error } = await supabase.rpc("actualizar_unidades_masivo", { p_cambios: cambios });
  if (error) throw error;
}

export async function aplicarPreciosPlatosMasivo(cambios) {
  // cambios: [{ platoId, precioVenta }]
  const { error } = await supabase.rpc("aplicar_precios_platos_masivo", { p_cambios: cambios });
  if (error) throw error;
}

/* ══════════════════════════════════════════════════════════════
   COSTOS FIJOS
   ══════════════════════════════════════════════════════════════ */
export async function crearCostoFijo(companyId, c) {
  const { error } = await supabase.from("costos_fijos").insert({
    id: c.id, company_id: companyId, nombre: c.nombre, categoria: c.categoria,
    monto: c.monto, frecuencia: c.frecuencia, notas: c.notas, proximo_ajuste: c.proximoAjuste,
  });
  if (error) throw error;
}

export async function actualizarCostoFijo(c) {
  const { error } = await supabase.from("costos_fijos").update({
    nombre: c.nombre, categoria: c.categoria, monto: c.monto, frecuencia: c.frecuencia,
    notas: c.notas, proximo_ajuste: c.proximoAjuste, updated_at: new Date().toISOString(),
  }).eq("id", c.id);
  if (error) throw error;
}

export async function borrarCostoFijo(id) {
  const { error } = await supabase.from("costos_fijos").delete().eq("id", id);
  if (error) throw error;
}

/* ══════════════════════════════════════════════════════════════
   VENTAS — las dos operaciones que tocan varias filas van por RPC,
   así son atómicas (todo o nada).
   ══════════════════════════════════════════════════════════════ */
export async function registrarPedido(companyId, pedidoId, fecha, medioPago, items) {
  const { error } = await supabase.rpc("registrar_pedido", {
    p_pedido_id: pedidoId, p_company_id: companyId, p_fecha: fecha, p_medio_pago: medioPago,
    p_items: items.map((it) => ({
      id: it.id, platoId: it.platoId, platoNombre: it.platoNombre, cantidad: it.cantidad,
      precioUnitario: it.precioUnitario, costoUnitario: it.costoUnitario, notas: it.notas || "",
    })),
  });
  if (error) throw error;
}

export async function borrarPedido(pedidoId, motivo, usuarioId) {
  const { data, error } = await supabase.rpc("borrar_pedido", {
    p_pedido_id: pedidoId, p_motivo: motivo || "", p_usuario_id: usuarioId,
  });
  if (error) throw error;
  return data; // el id de la corrección recién creada, para poder deshacerla después
}

export async function deshacerBorradoPedido(correccionId) {
  const { error } = await supabase.rpc("deshacer_borrado_pedido", { p_correccion_id: correccionId });
  if (error) throw error;
}

/* ══════════════════════════════════════════════════════════════
   CATEGORÍAS, BENCHMARKS, CONFIGURACIÓN
   ══════════════════════════════════════════════════════════════ */
export async function agregarCategoria(companyId, tipo, nombre) {
  const { error } = await supabase.from("categorias").insert({ company_id: companyId, tipo, nombre });
  if (error) throw error;
}

export async function actualizarBenchmark(id, cambios) {
  const { error } = await supabase.from("benchmarks").update(cambios).eq("id", id);
  if (error) throw error;
}

export async function actualizarConfiguracion(companyId, cambios) {
  // cambios viene en camelCase (como lo usa la UI) — lo traducimos a las
  // columnas reales acá, así el resto de la app no necesita saber esto.
  const columnas = {
    margenObjetivo: "margen_objetivo", iva: "iva", preciosIncluyenIVA: "precios_incluyen_iva",
    modoProrrateo: "modo_prorrateo", horasPorDia: "horas_por_dia", diasPorMes: "dias_por_mes",
    temaOscuro: "tema_oscuro", ocultarChecklist: "ocultar_checklist",
    ayudaColapsada: "ayuda_colapsada", novedadesVistas: "novedades_vistas",
  };
  const update = { updated_at: new Date().toISOString() };
  for (const [k, v] of Object.entries(cambios)) {
    if (columnas[k]) update[columnas[k]] = v;
  }
  const { error } = await supabase.from("configuracion").update(update).eq("company_id", companyId);
  if (error) throw error;
}
