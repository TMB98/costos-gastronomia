import React, { useState } from "react";
import { usePuedeEditar } from "../../auth/usuarios.js";
import { ROJO, ROJO_BG, VERDE, VERDE_BG, AMARILLO, AMARILLO_BG, NAVY, NAVY_TEXT, inputCls } from "../../config/constants.js";
import { $, $0, pct1, nf0, nf2 } from "../../lib/formato.js";
import { conIVA } from "../../lib/calculos.js";
import { TrendingUp, AlertTriangle } from "../../components/icons.jsx";
import AyudaSeccion from "../../components/AyudaSeccion.jsx";
import Tarjeta from "../../components/Tarjeta.jsx";
import Boton from "../../components/Boton.jsx";
import Campo from "../../components/Campo.jsx";
import Formula from "../../components/Formula.jsx";
import Chip from "../../components/Chip.jsx";

function SeccionPricing({ data, cfg, platosCalc, totalCF, totales, cfPorPorcion, prorrateoSinDatos, setCfg, setData, toast, setConfirmar }) {
  const puedeEditar = usePuedeEditar();
  const [sel, setSel] = useState(platosCalc[0]?.id || null);
  const plato = platosCalc.find((p) => p.id === sel) || platosCalc[0];
  // Si ya venías usando un modo distinto al simple ("unidades"), arrancamos
  // directo en modo avanzado — no le escondemos a nadie su propia configuración.
  const [modoAvanzado, setModoAvanzado] = useState(cfg.modoProrrateo !== "unidades");

  const MODOS = {
    unidades: "Por unidades vendidas (cada porción absorbe lo mismo)",
    ingresos: "Por facturación (los platos caros absorben más)",
    costoIngredientes: "Por costo de ingredientes",
  };

  const sugerido = (costoReal, margen) => (margen >= 100 ? null : costoReal / (1 - margen / 100));

  const veredicto = (p) => {
    if (p.incompleto) return { txt: "Faltan precios de ingredientes 🔴", color: ROJO, bg: ROJO_BG };
    const cf = cfPorPorcion(p);
    const real = p.costoPorcion + cf;
    const obj = sugerido(real, cfg.margenObjetivo);
    if (p.neto < real) return { txt: "Estás perdiendo plata 🔴", color: ROJO, bg: ROJO_BG };
    const dif = ((p.neto - obj) / obj) * 100;
    if (dif >= 5) return { txt: "Estás cobrando de más ✅", color: VERDE, bg: VERDE_BG };
    if (dif >= -10) return { txt: "Estás en zona ok ✅", color: VERDE, bg: VERDE_BG };
    return { txt: "Estás cobrando de menos ⚠️", color: AMARILLO, bg: AMARILLO_BG };
  };

  // Platos que HOY están perdiendo plata (precio actual por debajo del costo real).
  // Excluimos los "incompletos" (les falta precio de algún ingrediente) porque para
  // esos no se puede calcular un precio sugerido confiable todavía.
  const platosPerdiendoPlata = platosCalc.filter((p) => {
    if (p.incompleto) return false;
    const real = p.costoPorcion + cfPorPorcion(p);
    return p.neto < real;
  });

  const aplicarPrecioMasivo = () => {
    if (platosPerdiendoPlata.length === 0) return;
    const cantidad = platosPerdiendoPlata.length;
    setConfirmar({
      msg: `Vas a actualizar el precio de ${cantidad} plato${cantidad > 1 ? "s" : ""} que hoy ${cantidad > 1 ? "están" : "está"} perdiendo plata, llevándolo${cantidad > 1 ? "s" : ""} al margen objetivo (${cfg.margenObjetivo}%). Podés revisar los precios nuevos en la pestaña Platos después.`,
      accion: () => {
        setData((d) => ({
          ...d,
          platos: d.platos.map((raw) => {
            const p = platosPerdiendoPlata.find((c) => c.id === raw.id);
            if (!p) return raw;
            const real = p.costoPorcion + cfPorPorcion(p);
            const nuevoNeto = sugerido(real, cfg.margenObjetivo);
            if (nuevoNeto == null) return raw; // margen objetivo >= 100%, no se puede calcular
            const nuevoPrecioVenta = cfg.preciosIncluyenIVA ? conIVA(nuevoNeto, cfg) : nuevoNeto;
            return { ...raw, precioVenta: Math.round(nuevoPrecioVenta * 100) / 100 };
          }),
        }));
        toast(`✅ Precio actualizado en ${cantidad} plato${cantidad > 1 ? "s" : ""}`);
      },
    });
  };

  return (
    <>
      <AyudaSeccion
        id="pricing"
        cfg={cfg} setCfg={setCfg}
        objetivo="El motor de precios: te dice cuánto tenés que cobrar para llegar al margen que buscás, plato por plato — no cuánto te gustaría cobrar."
        pasos={[
          "Configurá tu margen objetivo, el IVA, y cómo querés repartir los costos fijos entre los platos.",
          "Elegí un plato en la calculadora para ver el cálculo completo, paso a paso.",
          "Comparná el precio sugerido contra lo que cobrás hoy y actuá según el veredicto (subir, bajar, o dejar como está).",
        ]}
      />

      {platosPerdiendoPlata.length > 0 && puedeEditar && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
          <p className="text-sm text-red-800 dark:text-red-300">
            <b>{platosPerdiendoPlata.length} plato{platosPerdiendoPlata.length > 1 ? "s" : ""} {platosPerdiendoPlata.length > 1 ? "están" : "está"} perdiendo plata</b> ahora mismo — el precio actual no cubre ni el costo real.
          </p>
          <Boton size="sm" onClick={aplicarPrecioMasivo}>
            <TrendingUp size={14} /> Aplicar precio sugerido a todos
          </Boton>
        </div>
      )}

      <Tarjeta titulo="Parámetros de pricing" subtitulo="Se aplican a toda la carta.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Campo label="Margen objetivo (%)" hint="Estándar de restaurantes en Argentina: 65%.">
            <input type="number" min="0" max="95" className={inputCls} value={cfg.margenObjetivo} disabled={!puedeEditar}
              onChange={(e) => setCfg("margenObjetivo", Number(e.target.value))} />
          </Campo>
          <Campo label="IVA aplicable (%)">
            <select className={inputCls} value={cfg.iva} disabled={!puedeEditar} onChange={(e) => setCfg("iva", Number(e.target.value))}>
              <option value={21}>21%</option>
              <option value={10.5}>10,5%</option>
              <option value={0}>Sin IVA / monotributo</option>
            </select>
          </Campo>
          <Campo label="Los precios de venta que cargo…">
            <select className={inputCls} value={cfg.preciosIncluyenIVA ? "si" : "no"} disabled={!puedeEditar}
              onChange={(e) => setCfg("preciosIncluyenIVA", e.target.value === "si")}>
              <option value="si">Ya incluyen IVA (precio de carta)</option>
              <option value="no">Son netos, sin IVA</option>
            </select>
          </Campo>
          <Campo label="Cómo reparto los costos fijos" hint={modoAvanzado ? "Cambiá el criterio y mirá cómo se mueve el veredicto." : undefined}>
            {modoAvanzado ? (
              <select className={inputCls} value={cfg.modoProrrateo} disabled={!puedeEditar} onChange={(e) => setCfg("modoProrrateo", e.target.value)}>
                {Object.entries(MODOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            ) : (
              <div>
                <p className="rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-700/40 dark:text-gray-300">
                  Por unidades vendidas <span className="text-gray-400 dark:text-gray-500">(cada porción absorbe lo mismo)</span>
                </p>
                {puedeEditar && (
                  <button
                    type="button"
                    onClick={() => setModoAvanzado(true)}
                    className="mt-1 text-xs font-medium"
                    style={{ color: NAVY_TEXT }}
                  >
                    ¿Necesitás otro criterio? Activar modo avanzado
                  </button>
                )}
              </div>
            )}
          </Campo>
        </div>

        <div className="mt-4 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/40 p-3">
          <p className="mb-2 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">Unidades estimadas vendidas por mes</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {platosCalc.map((p) => (
              <label key={p.id} className="block">
                <span className="mb-1 block truncate text-xs text-gray-600 dark:text-gray-400" title={p.nombre}>{p.nombre}</span>
                <input type="number" min="0" className={inputCls} value={cfg.unidades[p.id] ?? 0} disabled={!puedeEditar}
                  onChange={(e) => setCfg("unidades", { ...cfg.unidades, [p.id]: Number(e.target.value) })} />
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
            Total: <b>{nf0.format(totales.unidadesTot)}</b> porciones/mes · Costo fijo total: <b>{$0(totalCF)}</b> ·
            {cfg.modoProrrateo === "unidades"
              ? ` Cada porción absorbe ${$(totales.unidadesTot ? totalCF / totales.unidadesTot : 0)} de costos fijos.`
              : cfg.modoProrrateo === "ingresos"
                ? ` Los costos fijos equivalen al ${pct1(totales.ingresos ? (totalCF / totales.ingresos) * 100 : 0)} del precio neto de cada plato.`
                : ` Los costos fijos equivalen a ${nf2.format(totales.costoIng ? totalCF / totales.costoIng : 0)}× el costo de ingredientes de cada plato.`}
          </p>
        </div>
      </Tarjeta>

      <Tarjeta titulo="Calculadora de precio sugerido" subtitulo="Elegí un plato para ver el cálculo completo, paso a paso.">
        {prorrateoSinDatos && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>
              <b>Todavía no cargaste {cfg.modoProrrateo === "unidades" ? "unidades estimadas" : cfg.modoProrrateo === "ingresos" ? "unidades (para calcular facturación)" : "unidades (para calcular costo de ingredientes)"} para ningún plato.</b>{" "}
              Por eso "Parte proporcional de costos fijos" da $0,00 abajo — no es que no tengas costos que cubrir,
              es que todavía no hay datos para repartirlos. Completá el cuadro de "Unidades estimadas" más arriba.
            </span>
          </div>
        )}
        <select className={inputCls + " mb-4 sm:w-96"} value={sel || ""} onChange={(e) => setSel(e.target.value)}>
          {platosCalc.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>

        {plato && (() => {
          const cf = cfPorPorcion(plato);
          const real = plato.costoPorcion + cf;
          const v = veredicto(plato);
          const filas = [
            { l: "Costo de ingredientes por porción", v: plato.incompleto ? null : plato.costoPorcion, f: "Costo total de la receta / porciones que rinde" },
            {
              l: "Parte proporcional de costos fijos", v: cf, f: MODOS[cfg.modoProrrateo],
              advertencia: prorrateoSinDatos,
            },
            { l: "Costo total real por porción", v: plato.incompleto ? null : real, f: "Ingredientes + costos fijos asignados", fuerte: true },
            { l: "Precio mínimo para no perder plata (punto de equilibrio)", v: plato.incompleto ? null : real, f: "Precio neto = costo total real. Con IVA: " + $(conIVA(real, cfg)) },
          ];
          const margenes = [cfg.margenObjetivo, 50, 40];
          return (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div>
                <table className="w-full text-sm">
                  <tbody>
                    {filas.map((f, i) => (
                      <tr key={i} className={i % 2 ? "bg-gray-50 dark:bg-gray-700/40" : ""}>
                        <td className="px-3 py-2.5 align-top">
                          <span className={f.fuerte ? "font-semibold" : ""}>{f.l}</span>
                          <Formula>{f.f}</Formula>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-right align-top font-semibold" style={{ color: f.advertencia ? AMARILLO : NAVY }}>
                          {f.advertencia ? "⚠️ Sin datos" : f.v == null ? "—" : $(f.v)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-3 overflow-x-auto rounded border border-gray-200 dark:border-gray-700">
                  <table className="w-full text-sm">
                    <thead style={{ backgroundColor: NAVY }}>
                      <tr className="text-left text-xs uppercase tracking-wide text-white">
                        <th className="px-3 py-2">Margen</th>
                        <th className="px-3 py-2 text-right">Precio neto sugerido</th>
                        <th className="px-3 py-2 text-right">Precio de carta (con IVA)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {margenes.map((m, i) => {
                        const s = plato.incompleto ? null : sugerido(real, m);
                        return (
                          <tr key={m} className={i % 2 ? "bg-gray-50 dark:bg-gray-700/40" : "bg-white dark:bg-gray-800"}>
                            <td className="px-3 py-2">{nf0.format(m)}%{m === cfg.margenObjetivo && " (objetivo)"}</td>
                            <td className="px-3 py-2 text-right font-medium">{s == null ? "—" : $(s)}</td>
                            <td className="px-3 py-2 text-right font-bold" style={{ color: NAVY_TEXT }}>{s == null ? "—" : $(conIVA(s, cfg))}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <p className="bg-gray-50 dark:bg-gray-700/40 px-3 py-2 text-xs italic text-gray-500 dark:text-gray-400">
                    Precio sugerido = costo total real / (1 − margen). No es costo × (1 + margen): eso da un margen menor al buscado.
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <h4 className="mb-3 text-sm font-bold uppercase tracking-wide" style={{ color: NAVY_TEXT }}>Comparativa con el precio actual</h4>
                <dl className="space-y-2.5 text-sm">
                  <div className="flex justify-between gap-3"><dt className="text-gray-600 dark:text-gray-400">Precio que cobrás hoy (carta)</dt><dd className="font-semibold">{$(plato.precioVenta)}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-gray-600 dark:text-gray-400">Precio neto equivalente</dt><dd className="font-semibold">{$(plato.neto)}</dd></div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-600 dark:text-gray-400">Precio sugerido al {nf0.format(cfg.margenObjetivo)}% (carta)</dt>
                    <dd className="font-semibold">{plato.incompleto ? "—" : $(conIVA(sugerido(real, cfg.margenObjetivo), cfg))}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-600 dark:text-gray-400">Diferencia</dt>
                    <dd className="font-semibold" style={{ color: plato.incompleto ? undefined : plato.precioVenta >= conIVA(sugerido(real, cfg.margenObjetivo), cfg) ? VERDE : ROJO }}>
                      {plato.incompleto ? "—" : (plato.precioVenta - conIVA(sugerido(real, cfg.margenObjetivo), cfg) > 0 ? "+" : "") + $(plato.precioVenta - conIVA(sugerido(real, cfg.margenObjetivo), cfg))}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3 border-t pt-2.5">
                    <dt className="text-gray-600 dark:text-gray-400">Margen bruto (solo ingredientes)</dt>
                    <dd className="font-semibold" style={{ color: plato.sem.color }}>{plato.margen == null ? "—" : pct1(plato.margen)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-600 dark:text-gray-400">Margen real (con costos fijos)</dt>
                    <dd className="font-semibold">{plato.incompleto || plato.neto <= 0 ? "—" : pct1(((plato.neto - real) / plato.neto) * 100)}</dd>
                  </div>
                </dl>
                <div className="mt-4 rounded p-3 text-center text-sm font-bold" style={{ backgroundColor: v.bg, color: v.color }}>
                  {v.txt}
                </div>
                <Formula>El veredicto compara el precio neto actual contra el sugerido al margen objetivo, con tolerancia de −10%.</Formula>
              </div>
            </div>
          );
        })()}
      </Tarjeta>

      <Tarjeta titulo="Resumen de toda la carta" subtitulo="Precios sugeridos al margen objetivo, con costos fijos incluidos.">
        <div className="overflow-x-auto rounded border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead style={{ backgroundColor: NAVY }}>
              <tr className="text-left text-xs uppercase tracking-wide text-white">
                <th className="px-3 py-2.5">Plato</th>
                <th className="px-3 py-2.5 text-right">Ingred./porción</th>
                <th className="px-3 py-2.5 text-right">Fijos/porción</th>
                <th className="px-3 py-2.5 text-right">Costo real</th>
                <th className="px-3 py-2.5 text-right">Precio hoy</th>
                <th className="px-3 py-2.5 text-right">Sugerido {nf0.format(cfg.margenObjetivo)}%</th>
                <th className="px-3 py-2.5">Veredicto</th>
              </tr>
            </thead>
            <tbody>
              {platosCalc.map((p, i) => {
                const cf = cfPorPorcion(p);
                const real = p.costoPorcion + cf;
                const sug = p.incompleto ? null : conIVA(sugerido(real, cfg.margenObjetivo), cfg);
                const v = veredicto(p);
                return (
                  <tr key={p.id} className={i % 2 ? "bg-gray-50 dark:bg-gray-700/40" : "bg-white dark:bg-gray-800"}>
                    <td className="px-3 py-2 font-medium">{p.nombre}</td>
                    <td className="px-3 py-2 text-right">{p.incompleto ? "—" : $(p.costoPorcion)}</td>
                    <td className="px-3 py-2 text-right">{$(cf)}</td>
                    <td className="px-3 py-2 text-right font-medium">{p.incompleto ? "—" : $(real)}</td>
                    <td className="px-3 py-2 text-right">{$(p.precioVenta)}</td>
                    <td className="px-3 py-2 text-right font-semibold" style={{ color: NAVY_TEXT }}>{sug == null ? "—" : $(sug)}</td>
                    <td className="px-3 py-2"><Chip color={v.color} bg={v.bg}>{v.txt}</Chip></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Tarjeta>
    </>
  );
}

export default SeccionPricing;
