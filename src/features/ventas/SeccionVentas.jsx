import React, { useState, useEffect, useMemo } from "react";
import { usePuedeVentas, usePuedeEditar, useEsAdmin } from "../../auth/usuarios.js";
import { NAVY, NAVY_TEXT, AMARILLO_TEXT, VERDE, VERDE_BG, inputCls } from "../../config/constants.js";
import { hoyISO, $, $0, fechaCorta, nf0 } from "../../lib/formato.js";
import { Plus, X, Check, AlertTriangle, Trash2, TrendingUp } from "../../components/icons.jsx";
import AyudaSeccion from "../../components/AyudaSeccion.jsx";
import KPI from "../../components/KPI.jsx";
import Tarjeta from "../../components/Tarjeta.jsx";
import Campo from "../../components/Campo.jsx";
import Boton from "../../components/Boton.jsx";
import ConTooltip from "../../components/ConTooltip.jsx";
import Chip from "../../components/Chip.jsx";

function SeccionVentas({ data, platosCalc, borrar, borrarPedidoVenta, onRegistrarVenta, onActualizarUnidadesMasivo, toast, cfg, setCfg, setModal, platoRecienCreado, limpiarPlatoRecienCreado, totalCF }) {
  const puedeVentas = usePuedeVentas();
  const puedeEditar = usePuedeEditar();
  const esAdmin = useEsAdmin();
  const [fecha, setFecha] = useState(hoyISO());
  const [medioPago, setMedioPago] = useState("efectivo");
  const [platoId, setPlatoId] = useState(platosCalc[0]?.id || "");
  const [cantidad, setCantidad] = useState(1);
  const [carrito, setCarrito] = useState([]); // ítems del pedido en curso, todavía sin confirmar
  const [borrandoPedido, setBorrandoPedido] = useState(null); // pedidoId en proceso de borrado
  const [motivoBorrado, setMotivoBorrado] = useState("");
  const [filtroDesde, setFiltroDesde] = useState("");

  const MEDIOS_PAGO = { efectivo: "Efectivo", tarjeta: "Tarjeta", transferencia: "Transferencia" };

  // Si el usuario acaba de crear un plato desde el atajo "Agregar plato nuevo"
  // de acá abajo, lo seleccionamos solo apenas se guarda — así puede seguir
  // cargando el pedido sin un click extra.
  useEffect(() => {
    if (platoRecienCreado) {
      setPlatoId(platoRecienCreado);
      limpiarPlatoRecienCreado();
      toast("✅ Plato creado y seleccionado — agregalo al pedido y completá la venta");
    }
  }, [platoRecienCreado]);

  const platoElegido = platosCalc.find((p) => p.id === platoId);

  const agregarAlCarrito = () => {
    if (!puedeVentas) return;
    if (!platoElegido || !cantidad || Number(cantidad) <= 0) {
      toast("⚠️ Elegí un plato y una cantidad válida");
      return;
    }
    setCarrito((c) => {
      // Si el mismo plato ya está en el pedido, sumamos la cantidad en vez de
      // duplicar la línea — así el pedido queda prolijo aunque agregues el
      // mismo plato dos veces por error o porque se acordó de más.
      const yaEsta = c.find((it) => it.platoId === platoElegido.id);
      if (yaEsta) {
        return c.map((it) => (it.platoId === platoElegido.id ? { ...it, cantidad: it.cantidad + Number(cantidad) } : it));
      }
      return [
        ...c,
        {
          platoId: platoElegido.id,
          platoNombre: platoElegido.nombre,
          cantidad: Number(cantidad),
          precioUnitario: Number(platoElegido.precioVenta) || 0,
          costoUnitario: platoElegido.incompleto ? 0 : Number(platoElegido.costoPorcion) || 0,
          incompleto: !!platoElegido.incompleto,
        },
      ];
    });
    setCantidad(1);
  };

  const quitarDelCarrito = (platoIdAQuitar) => setCarrito((c) => c.filter((it) => it.platoId !== platoIdAQuitar));

  const totalCarrito = carrito.reduce((s, it) => s + it.cantidad * it.precioUnitario, 0);

  const confirmarVenta = () => {
    if (!puedeVentas) return;
    if (carrito.length === 0) {
      toast("⚠️ Todavía no agregaste ningún ítem al pedido");
      return;
    }
    onRegistrarVenta(fecha, medioPago, carrito);
    setCarrito([]);
  };

  const ventasFiltradas = useMemo(() => {
    const todas = data.ventas || [];
    if (!filtroDesde) return todas;
    return todas.filter((v) => v.fecha >= filtroDesde);
  }, [data.ventas, filtroDesde]);

  const ventasOrdenadas = useMemo(
    () => [...ventasFiltradas].sort((a, b) => (a.fecha < b.fecha ? 1 : -1)),
    [ventasFiltradas]
  );

  // Agrupamos las líneas de venta por pedido para mostrar el historial como
  // "pedidos" (un pedido = varios ítems + un total), no como líneas sueltas.
  // Las ventas viejas (de antes de este cambio) no tienen pedidoId — cada una
  // de esas se trata como su propio pedido de un solo ítem, para no romper
  // nada de lo que ya estaba cargado.
  const pedidosAgrupados = useMemo(() => {
    const porPedido = {};
    const orden = [];
    ventasOrdenadas.forEach((v) => {
      const pid = v.pedidoId || v.id;
      if (!porPedido[pid]) {
        porPedido[pid] = { pedidoId: pid, fecha: v.fecha, medioPago: v.medioPago, items: [] };
        orden.push(pid);
      }
      porPedido[pid].items.push(v);
    });
    return orden.map((pid) => {
      const p = porPedido[pid];
      const total = p.items.reduce((s, it) => s + it.cantidad * it.precioUnitario, 0);
      return { ...p, total };
    });
  }, [ventasOrdenadas]);

  // Numeración amigable de pedidos ("Venta #N"), en orden cronológico de
  // creación (el más viejo es el #1) — es solo para mostrar en pantalla, no
  // reemplaza ningún comprobante fiscal.
  const numeroDePedido = useMemo(() => {
    const cronologico = [...pedidosAgrupados].reverse(); // pedidosAgrupados viene del más nuevo al más viejo
    const mapa = {};
    cronologico.forEach((p, i) => (mapa[p.pedidoId] = i + 1));
    return mapa;
  }, [pedidosAgrupados]);

  // Ranking 80/20 con datos reales
  const ranking8020 = useMemo(() => {
    const acc = {};
    ventasFiltradas.forEach((v) => {
      if (!acc[v.platoId]) acc[v.platoId] = { platoId: v.platoId, nombre: v.platoNombre, unidades: 0, facturado: 0, costo: 0 };
      acc[v.platoId].unidades += Number(v.cantidad);
      acc[v.platoId].facturado += Number(v.cantidad) * Number(v.precioUnitario);
      acc[v.platoId].costo += Number(v.cantidad) * Number(v.costoUnitario || 0);
    });
    const arr = Object.values(acc).sort((a, b) => b.facturado - a.facturado);
    const totalFacturado = arr.reduce((s, x) => s + x.facturado, 0) || 1;
    let acumulado = 0;
    return arr.map((x) => {
      acumulado += x.facturado;
      return {
        ...x,
        pct: (x.facturado / totalFacturado) * 100,
        pctAcum: (acumulado / totalFacturado) * 100,
        margen: x.facturado > 0 ? ((x.facturado - x.costo) / x.facturado) * 100 : null,
      };
    });
  }, [ventasFiltradas]);

  const totalFacturadoPeriodo = ranking8020.reduce((s, x) => s + x.facturado, 0);
  const totalUnidadesPeriodo = ranking8020.reduce((s, x) => s + x.unidades, 0);
  const diasConDatos = new Set(ventasFiltradas.map((v) => v.fecha)).size;
  const pocoDatos = diasConDatos < 5;

  const usarEnPricing = () => {
    if (diasConDatos === 0) { toast("⚠️ No hay ventas registradas todavía"); return; }
    const factor = 30 / diasConDatos;
    const cambios = ranking8020.map((r) => ({ platoId: r.platoId, unidades: Math.round(r.unidades * factor) }));
    onActualizarUnidadesMasivo(cambios);
    toast("📈 Estimaciones de Pricing actualizadas con ventas reales");
  };

  // ---- Ganancia real de este mes calendario ----
  const resumenMes = useMemo(() => {
    const hoy = new Date(hoyISO());
    const inicioMes = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-01`;
    const ventasDelMes = (data.ventas || []).filter((v) => v.fecha >= inicioMes);
    const facturacion = ventasDelMes.reduce((s, v) => s + v.cantidad * v.precioUnitario, 0);
    const costoVendido = ventasDelMes.reduce((s, v) => s + v.cantidad * (v.costoUnitario || 0), 0);
    const ganancia = facturacion - costoVendido - totalCF;
    const porMedio = {};
    ventasDelMes.forEach((v) => {
      const m = v.medioPago || "sin especificar";
      porMedio[m] = (porMedio[m] || 0) + v.cantidad * v.precioUnitario;
    });
    return { facturacion, costoVendido, ganancia, porMedio, cantidadVentas: ventasDelMes.length };
  }, [data.ventas, totalCF]);

  return (
    <>
      <AyudaSeccion
        id="ventas"
        cfg={cfg} setCfg={setCfg}
        objetivo="Registrá lo que efectivamente vendiste, agrupado por pedido — como una comanda. Con estos datos reales armamos el ranking 80/20, calculamos cuánto ganaste de verdad este mes, y afinamos las estimaciones de Pricing."
        pasos={[
          "Elegí platos y cantidades, agregalos al pedido — podés sumar varios ítems antes de confirmar.",
          "Elegí el medio de pago y confirmá la venta: se guarda como un solo pedido con todos sus ítems.",
          "Mirá el resumen de \"Ganancia real de este mes\" para saber si estás ganando plata de verdad.",
        ]}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KPI label="Facturación de este mes" valor={$0(resumenMes.facturacion)} detalle={`${resumenMes.cantidadVentas} venta${resumenMes.cantidadVentas === 1 ? "" : "s"}`} />
        <KPI label="Costo real de lo vendido" valor={$0(resumenMes.costoVendido)} detalle="Ingredientes de lo que vendiste" />
        <KPI
          label={resumenMes.ganancia >= 0 ? "Ganancia real de este mes" : "Pérdida real de este mes"}
          valor={$0(Math.abs(resumenMes.ganancia))}
          detalle="Facturación − costo de lo vendido − costos fijos"
        />
      </div>
      {resumenMes.cantidadVentas > 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Por medio de pago:{" "}
          {Object.entries(resumenMes.porMedio).map(([m, v], i) => (
            <span key={m}>
              {i > 0 && " · "}
              <b className="text-gray-700 dark:text-gray-300">{MEDIOS_PAGO[m] || m}</b>: {$0(v)}
            </span>
          ))}
        </p>
      )}

      {puedeVentas && (
      <Tarjeta
        titulo="Registrar una venta"
        subtitulo="Armá el pedido agregando ítems, elegí cómo pagó, y confirmá — igual que una comanda."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <Campo label="Plato" className="sm:col-span-2">
            <select
              className={inputCls}
              value={platoId}
              onChange={(e) => {
                if (e.target.value === "__nuevo__") {
                  setModal({ tipo: "plato" });
                } else {
                  setPlatoId(e.target.value);
                }
              }}
            >
              <option value="__nuevo__">➕ Agregar plato nuevo…</option>
              {platosCalc.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </Campo>
          <Campo label="Cantidad">
            <input type="number" min="1" className={inputCls} value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
          </Campo>
          <div className="flex items-end">
            <Boton onClick={agregarAlCarrito} className="w-full justify-center">
              <Plus size={15} /> Agregar al pedido
            </Boton>
          </div>
        </div>

        {carrito.length > 0 && (
          <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead style={{ backgroundColor: NAVY }}>
                <tr className="text-left text-xs uppercase tracking-wide text-white">
                  <th className="px-3 py-2">Ítem</th>
                  <th className="px-3 py-2 text-right">Cant.</th>
                  <th className="px-3 py-2 text-right">Subtotal</th>
                  <th className="px-3 py-2 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {carrito.map((it, i) => (
                  <tr key={it.platoId} className={i % 2 ? "bg-gray-50 dark:bg-gray-700/40" : "bg-white dark:bg-gray-800"}>
                    <td className="px-3 py-2">
                      {it.platoNombre}
                      {it.incompleto && <span className="ml-1 text-xs" style={{ color: AMARILLO_TEXT }}>⚠️ costo incompleto</span>}
                    </td>
                    <td className="px-3 py-2 text-right">{it.cantidad}</td>
                    <td className="px-3 py-2 text-right font-medium">{$(it.cantidad * it.precioUnitario)}</td>
                    <td className="px-3 py-2 text-right">
                      <button onClick={() => quitarDelCarrito(it.platoId)} className="rounded p-1 text-red-600 hover:bg-red-50" title="Quitar del pedido">
                        <X size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 font-bold" style={{ borderColor: NAVY }}>
                  <td className="px-3 py-2" colSpan={2}>Total del pedido</td>
                  <td className="px-3 py-2 text-right" style={{ color: NAVY_TEXT }}>{$(totalCarrito)}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Campo label="Fecha">
            <input type="date" className={inputCls} value={fecha} onChange={(e) => setFecha(e.target.value)} max={hoyISO()} />
          </Campo>
          <Campo label="Medio de pago">
            <select className={inputCls} value={medioPago} onChange={(e) => setMedioPago(e.target.value)}>
              {Object.entries(MEDIOS_PAGO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Campo>
          <div className="flex items-end">
            <Boton onClick={confirmarVenta} className="w-full justify-center" disabled={carrito.length === 0}>
              <Check size={15} /> Confirmar venta{carrito.length > 0 && ` (${$(totalCarrito)})`}
            </Boton>
          </div>
        </div>
      </Tarjeta>
      )}

      <Tarjeta titulo="Historial de ventas" subtitulo="Tus pedidos confirmados, más recientes primero.">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap items-end gap-3">
            <Campo label="Ver desde">
              <input type="date" className={inputCls + " w-44"} value={filtroDesde} onChange={(e) => setFiltroDesde(e.target.value)} />
            </Campo>
            {filtroDesde && (
              <button onClick={() => setFiltroDesde("")} className="text-xs font-medium" style={{ color: NAVY_TEXT }}>
                Ver todo
              </button>
            )}
          </div>
          {puedeEditar && (
            <ConTooltip texto="Reemplaza las unidades estimadas de Pricing por lo que vendiste de verdad en este período">
              <Boton size="sm" variant="ghost" onClick={usarEnPricing}>
                <TrendingUp size={14} /> Usar en Pricing
              </Boton>
            </ConTooltip>
          )}
        </div>

        {pedidosAgrupados.length === 0 ? (
          <p className="rounded border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
            Todavía no registraste ninguna venta. Usá el formulario de arriba para cargar tu primer pedido.
          </p>
        ) : (
          <div className="max-h-[32rem] space-y-2.5 overflow-y-auto">
            {pedidosAgrupados.map((p) => (
              <div key={p.pedidoId} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                {borrandoPedido === p.pedidoId ? (
                  <div className="-m-3 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/30">
                    <p className="flex items-center gap-1.5 text-sm font-medium text-red-800 dark:text-red-300">
                      <AlertTriangle size={15} className="shrink-0" />
                      ¿Eliminar la Venta #{numeroDePedido[p.pedidoId]} ({$(p.total)})?
                    </p>
                    <input
                      className={inputCls + " mt-2"}
                      placeholder="Motivo (opcional) — ej: cargué torta, era cookie"
                      value={motivoBorrado}
                      onChange={(e) => setMotivoBorrado(e.target.value)}
                      autoFocus
                    />
                    <div className="mt-2 flex justify-end gap-2">
                      <Boton size="sm" variant="ghost" onClick={() => { setBorrandoPedido(null); setMotivoBorrado(""); }}>Cancelar</Boton>
                      <Boton size="sm" onClick={() => { borrarPedidoVenta(p.pedidoId, motivoBorrado); setBorrandoPedido(null); setMotivoBorrado(""); }}>
                        <Trash2 size={14} /> Eliminar venta
                      </Boton>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold" style={{ color: NAVY_TEXT }}>Venta #{numeroDePedido[p.pedidoId]}</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">{fechaCorta(p.fecha)}</span>
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                          {MEDIOS_PAGO[p.medioPago] || "Sin especificar"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold" style={{ color: NAVY_TEXT }}>{$(p.total)}</span>
                        {puedeVentas && (
                          <button
                            onClick={() => { setBorrandoPedido(p.pedidoId); setMotivoBorrado(""); }}
                            className="rounded p-1 text-red-600 hover:bg-red-50"
                            title="Eliminar esta venta"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                    <ul className="mt-1.5 space-y-0.5 text-xs text-gray-600 dark:text-gray-400">
                      {p.items.map((it) => (
                        <li key={it.id}>{it.cantidad} × {it.platoNombre} — {$(it.cantidad * it.precioUnitario)}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </Tarjeta>

      {esAdmin && (data.correccionesVentas || []).length > 0 && (
        <Tarjeta titulo="Correcciones de ventas" subtitulo="Solo vos ves esto — quién borró qué venta, cuándo y por qué.">
          <div className="max-h-96 space-y-2.5 overflow-y-auto">
            {data.correccionesVentas.map((c) => (
              <div key={c.id} className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{fechaCorta(c.fecha)}{c.hora ? ` · ${c.hora} hs` : ""} · borrado por <b className="text-gray-700 dark:text-gray-300">{c.usuario}</b></span>
                  <span className="text-sm font-bold" style={{ color: AMARILLO_TEXT }}>{$(c.total)}</span>
                </div>
                <ul className="mt-1 space-y-0.5 text-xs text-gray-600 dark:text-gray-400">
                  {c.items.map((it, i) => <li key={i}>{it.cantidad} × {it.platoNombre} — {$(it.cantidad * it.precioUnitario)}</li>)}
                </ul>
                {c.motivo && <p className="mt-1.5 text-xs italic text-gray-600 dark:text-gray-400">"{c.motivo}"</p>}
              </div>
            ))}
          </div>
        </Tarjeta>
      )}

      <Tarjeta titulo="Ranking 80/20 — con ventas reales">
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
          <h3 className="mb-1.5 text-sm font-bold" style={{ color: NAVY_TEXT }}>
            📐 ¿Qué es el 80/20 (principio de Pareto) y por qué importa acá?
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            En la gran mayoría de los negocios gastronómicos, un grupo chico de platos genera la mayor parte
            de la facturación — típicamente el <b>20% de los productos explica el 80% de las ventas</b>. Saber
            cuáles son esos platos te deja enfocar el esfuerzo donde más impacto tiene: cuidar que nunca les
            falte stock, negociar mejor esos insumos puntuales, y proteger su margen antes que el de cualquier
            otro. Esta sección va a mostrar ese ranking automáticamente, calculado con tus ventas reales — por
            ahora, seguí registrando cada venta arriba así ya tenés semanas de datos cargados para cuando se active.
          </p>
        </div>

        <div className="relative">
          <div className="pointer-events-none select-none blur-sm" aria-hidden="true">
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <KPI label="Facturación del período" valor={$0(totalFacturadoPeriodo || 245000)} />
              <KPI label="Unidades vendidas" valor={nf0.format(totalUnidadesPeriodo || 320)} />
              <KPI label="Platos que hacen el 80%" valor={2} detalle="de 5 platos con ventas" />
            </div>
            <div className="overflow-x-auto rounded border border-gray-200 dark:border-gray-700">
              <table className="w-full text-sm">
                <thead style={{ backgroundColor: NAVY }}>
                  <tr className="text-left text-xs uppercase tracking-wide text-white">
                    <th className="px-3 py-2.5">Plato</th>
                    <th className="px-3 py-2.5 text-right">Unidades</th>
                    <th className="px-3 py-2.5 text-right">Facturado</th>
                    <th className="px-3 py-2.5 text-right">% acumulado</th>
                    <th className="px-3 py-2.5">Grupo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white dark:bg-gray-800"><td className="px-3 py-2">Milanesa napolitana</td><td className="px-3 py-2 text-right">98</td><td className="px-3 py-2 text-right">$1.176.000</td><td className="px-3 py-2 text-right">48%</td><td className="px-3 py-2"><Chip color={VERDE} bg={VERDE_BG}>Genera el 80%</Chip></td></tr>
                  <tr className="bg-gray-50 dark:bg-gray-700/40"><td className="px-3 py-2">Empanadas de carne</td><td className="px-3 py-2 text-right">210</td><td className="px-3 py-2 text-right">$378.000</td><td className="px-3 py-2 text-right">78%</td><td className="px-3 py-2"><Chip color={VERDE} bg={VERDE_BG}>Genera el 80%</Chip></td></tr>
                  <tr className="bg-white dark:bg-gray-800"><td className="px-3 py-2">Menú del día</td><td className="px-3 py-2 text-right">56</td><td className="px-3 py-2 text-right">$252.000</td><td className="px-3 py-2 text-right">96%</td><td className="px-3 py-2"><Chip color="#64748b" bg="#f1f5f9">Cola larga</Chip></td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.55)" }}>
            <span className="text-3xl">🔜</span>
            <span className="rounded-full px-4 py-1.5 text-sm font-bold text-white" style={{ backgroundColor: NAVY }}>
              Próximamente
            </span>
            <span className="max-w-xs text-center text-xs text-gray-600 dark:text-gray-400">
              Se activa apenas tengas unos días de ventas reales cargadas — por ahora, registrá cada venta arriba.
            </span>
          </div>
        </div>
      </Tarjeta>
    </>
  );
}

export default SeccionVentas;
