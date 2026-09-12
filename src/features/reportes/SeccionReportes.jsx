import React, { useMemo } from "react";
import { UNIDADES, NAVY, NAVY_TEXT, VERDE, VERDE_BG, ROJO, ROJO_BG, AMARILLO, AMARILLO_BG } from "../../config/constants.js";
import { $, $0, pct1, nf0 } from "../../lib/formato.js";
import { cfMensual, precioEnFecha, semaforo, conIVA } from "../../lib/calculos.js";
import AyudaSeccion from "../../components/AyudaSeccion.jsx";
import KPI from "../../components/KPI.jsx";
import Tarjeta from "../../components/Tarjeta.jsx";
import Chip from "../../components/Chip.jsx";
import Formula from "../../components/Formula.jsx";
import BarraH from "../../components/graficos/BarraH.jsx";
import LineaSVG from "../../components/graficos/LineaSVG.jsx";

function SeccionReportes({ data, cfg, setCfg, platosCalc, totalCF, totales, cfPorPorcion, onActualizarBenchmark, mapIng }) {
  const conMargen = platosCalc.filter((p) => p.margen != null);
  const verdes = conMargen.filter((p) => p.margen > 65).length;
  const amarillos = conMargen.filter((p) => p.margen >= 40 && p.margen <= 65).length;
  const rojos = conMargen.filter((p) => p.margen < 40).length;
  const margenPromedio = totales.ingresos > 0 ? ((totales.ingresos - totales.costoIng) / totales.ingresos) * 100 : null;

  const ranking = [...conMargen].sort((a, b) => b.margen - a.margen)
    .map((p) => ({ nombre: p.nombre.length > 26 ? p.nombre.slice(0, 24) + "…" : p.nombre, margen: Number(p.margen.toFixed(1)) }));

  const sugerido = (costoReal, m) => costoReal / (1 - m / 100);

  const problematicos = platosCalc
    .map((p) => {
      const cf = cfPorPorcion(p);
      const real = p.costoPorcion + cf;
      const objetivo = conIVA(sugerido(real, cfg.margenObjetivo), cfg);
      const margenReal = p.neto > 0 && !p.incompleto ? ((p.neto - real) / p.neto) * 100 : null;
      let accion = "Subir precio";
      if (margenReal != null && margenReal < -20) accion = "Evaluar baja del menú";
      else if (objetivo > p.precioVenta * 1.35) accion = "Rediseñar receta";
      return { ...p, cf, real, objetivo, margenReal, accion, dif: objetivo - p.precioVenta };
    })
    .filter((p) => p.incompleto || (p.margen != null && p.margen < 65) || (p.margenReal != null && p.margenReal < 0))
    .sort((a, b) => (a.margenReal ?? -999) - (b.margenReal ?? -999));

  /* Top ingredientes por costo mensual */
  const topIng = useMemo(() => {
    const acc = {};
    platosCalc.forEach((p) => {
      const factor = p.porciones > 0 ? p.unidades / p.porciones : 0;
      p.detalle.forEach((d) => {
        if (d.error || !d.ing) return;
        acc[d.ing.nombre] = (acc[d.ing.nombre] || 0) + d.costo * factor;
      });
    });
    const arr = Object.entries(acc).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    const total = arr.reduce((a, x) => a + x.value, 0) || 1;
    return arr.slice(0, 10).map((x) => ({ ...x, pct: (x.value / total) * 100 }));
  }, [platosCalc]);

  /* Benchmarks */
  const laboral = data.costosFijos.filter((c) => c.categoria === "Personal / sueldos").reduce((a, c) => a + cfMensual(c), 0);
  const alquiler = data.costosFijos.filter((c) => c.categoria === "Alquiler").reduce((a, c) => a + cfMensual(c), 0);
  const valores = {
    b1: margenPromedio,
    b2: totales.ingresos > 0 ? (totales.costoIng / totales.ingresos) * 100 : null,
    b3: totales.ingresos > 0 ? (laboral / totales.ingresos) * 100 : null,
    b4: totales.ingresos > 0 ? (alquiler / totales.ingresos) * 100 : null,
  };
  const setBench = (id, k, v) => onActualizarBenchmark(id, k, v);

  /* Evolución de costos: costo de la carta valuado con precios históricos */
  const evolucion = useMemo(() => {
    const fechas = new Set();
    data.ingredientes.forEach((i) => (i.historial || []).forEach((h) => fechas.add(h.fecha)));
    const orden = [...fechas].sort();
    return orden.map((f) => {
      let costoCarta = 0;
      platosCalc.forEach((p) => {
        const factor = p.porciones > 0 ? p.unidades / p.porciones : 0;
        p.detalle.forEach((d) => {
          if (!d.ing) return;
          const precioHist = precioEnFecha(d.ing, f);
          if (precioHist == null) return;
          const ur = UNIDADES[d.unidad], ui = UNIDADES[d.ing.unidad];
          if (!ur || !ui || ur.grupo !== ui.grupo) return;
          costoCarta += Number(d.cantidad) * ur.f * (precioHist / ui.f) * factor;
        });
      });
      return { fecha: f.slice(0, 7).split("-").reverse().join("/"), costo: Math.round(costoCarta) };
    });
  }, [data.ingredientes, platosCalc]);

  const varEvol = evolucion.length > 1 ? ((evolucion[evolucion.length - 1].costo / evolucion[0].costo) - 1) * 100 : null;

  return (
    <>
      <AyudaSeccion
        id="reportes"
        cfg={cfg} setCfg={setCfg}
        objetivo="El resumen ejecutivo del negocio: qué platos son rentables, cuáles hay que revisar ya mismo, y cómo estás parado contra el promedio del mercado gastronómico argentino."
        pasos={[
          "Mirá el semáforo general de la carta para tener el panorama completo de un vistazo.",
          "Revisá la tabla de \"platos con poco margen\" — ahí está lo urgente para actuar hoy.",
          "Comparná tus números contra los benchmarks del rubro para saber si estás en línea con el mercado.",
        ]}
      />
      {/* PANEL 1 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPI label="Platos en el menú" valor={platosCalc.length} detalle={`${nf0.format(totales.unidadesTot)} porciones/mes estimadas`} />
        <KPI label="Semáforo de la carta" valor={`🟢 ${verdes} · 🟡 ${amarillos} · 🔴 ${rojos}`} detalle="Según margen bruto de cada plato" />
        <KPI label="Costo fijo mensual" valor={$0(totalCF)} detalle={`Equivale al ${pct1(totales.ingresos ? (totalCF / totales.ingresos) * 100 : 0)} de la facturación`} />
        <KPI label="Margen bruto promedio" valor={margenPromedio == null ? "—" : pct1(margenPromedio)}
          detalle="Ponderado por unidades vendidas" color={semaforo(margenPromedio).color} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KPI label="Facturación mensual estimada (neta)" valor={$0(totales.ingresos)} detalle="Σ precio neto × unidades" />
        <KPI label="Costo de ingredientes mensual" valor={$0(totales.costoIng)} detalle="Σ costo por porción × unidades" />
        <KPI label="Resultado antes de impuestos" valor={$0(totales.ingresos - totales.costoIng - totalCF)}
          detalle="Facturación − ingredientes − costos fijos"
          color={totales.ingresos - totales.costoIng - totalCF >= 0 ? VERDE : ROJO} />
      </div>

      {/* A partir de acá (Paneles 2 a 6) va todo blureado con "Próximamente disponible",
          igual criterio que en Ventas: mejor mostrar poco y claro que un montón de paneles
          a medio terminar que puedan confundir. El aviso queda "sticky" pegado arriba
          mientras se scrollea por el bloque blureado, sin importar cuán largo sea. */}
      <div className="relative">
        <div className="sticky top-4 z-20 mb-4 flex justify-center">
          <div className="flex flex-col items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-4 shadow-xl">
            <span className="text-3xl">🔜</span>
            <span className="rounded-full px-4 py-1.5 text-sm font-bold text-white" style={{ backgroundColor: NAVY }}>
              Próximamente disponible
            </span>
            <span className="max-w-xs text-center text-xs text-gray-600 dark:text-gray-400">
              Estos reportes se activan solos apenas tengas más datos reales cargados (ventas, precios). Por ahora, seguí usando el resumen de arriba.
            </span>
          </div>
        </div>
        <div className="pointer-events-none select-none space-y-5 blur-sm" aria-hidden="true">

      {/* PANEL 2 */}
      <Tarjeta titulo="Ranking de platos por rentabilidad" subtitulo="Margen bruto sobre precio neto. Verde >65%, rojo <40%.">
        <BarraH
          data={ranking.map((r) => ({ name: r.nombre, value: r.margen }))}
          valueFmt={(v) => pct1(v)}
          colorFn={(d) => (d.value > 65 ? "#16a34a" : d.value < 40 ? "#dc2626" : "#f59e0b")}
        />
      </Tarjeta>

      {/* PANEL 3 */}
      <Tarjeta titulo="Platos con poco margen o que pierden plata"
        subtitulo="El costo real incluye el prorrateo de costos fijos según el criterio elegido en Pricing.">
        {problematicos.length === 0 ? (
          <p className="rounded p-4 text-center text-sm font-medium" style={{ backgroundColor: VERDE_BG, color: VERDE }}>
            Ningún plato queda por debajo del objetivo. Toda la carta está en zona sana.
          </p>
        ) : (
          <div className="overflow-x-auto rounded border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead style={{ backgroundColor: NAVY }}>
                <tr className="text-left text-xs uppercase tracking-wide text-white">
                  <th className="px-3 py-2.5">Plato</th>
                  <th className="px-3 py-2.5 text-right">Costo real/porción</th>
                  <th className="px-3 py-2.5 text-right">Precio actual</th>
                  <th className="px-3 py-2.5 text-right">Margen bruto</th>
                  <th className="px-3 py-2.5 text-right">Margen real</th>
                  <th className="px-3 py-2.5 text-right">Precio para {nf0.format(cfg.margenObjetivo)}%</th>
                  <th className="px-3 py-2.5 text-right">Ajuste necesario</th>
                  <th className="px-3 py-2.5">Acción sugerida</th>
                </tr>
              </thead>
              <tbody>
                {problematicos.map((p, i) => (
                  <tr key={p.id} className={i % 2 ? "bg-gray-50 dark:bg-gray-700/40" : "bg-white dark:bg-gray-800"}>
                    <td className="px-3 py-2 font-medium">{p.incompleto && "🔴 "}{p.nombre}</td>
                    <td className="px-3 py-2 text-right">{p.incompleto ? "—" : $(p.real)}</td>
                    <td className="px-3 py-2 text-right">{$(p.precioVenta)}</td>
                    <td className="px-3 py-2 text-right font-medium" style={{ color: p.sem.color }}>{p.margen == null ? "—" : pct1(p.margen)}</td>
                    <td className="px-3 py-2 text-right font-medium" style={{ color: p.margenReal < 0 ? ROJO : undefined }}>
                      {p.margenReal == null ? "—" : pct1(p.margenReal)}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold" style={{ color: NAVY_TEXT }}>{p.incompleto ? "—" : $(p.objetivo)}</td>
                    <td className="px-3 py-2 text-right">{p.incompleto ? "—" : (p.dif > 0 ? "+" : "") + $(p.dif)}</td>
                    <td className="px-3 py-2">{p.incompleto ? "Completar precios" : p.accion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Tarjeta>

      {/* PANEL 4 */}
      <Tarjeta titulo="Materias primas más costosas"
        subtitulo="Top 10 por gasto mensual: costo del ingrediente × cantidad usada en todas las recetas × unidades vendidas.">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div>
            <BarraH data={topIng} valueFmt={(v) => $0(v)} colorFn={() => NAVY} />
          </div>
          <div className="overflow-x-auto rounded border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead style={{ backgroundColor: NAVY }}>
                <tr className="text-left text-xs uppercase tracking-wide text-white">
                  <th className="px-3 py-2">#</th><th className="px-3 py-2">Ingrediente</th>
                  <th className="px-3 py-2 text-right">Gasto mensual</th><th className="px-3 py-2 text-right">% del total</th>
                </tr>
              </thead>
              <tbody>
                {topIng.map((x, i) => (
                  <tr key={x.name} className={i % 2 ? "bg-gray-50 dark:bg-gray-700/40" : "bg-white dark:bg-gray-800"}>
                    <td className="px-3 py-1.5 text-gray-500 dark:text-gray-400">{i + 1}</td>
                    <td className="px-3 py-1.5">{x.name}</td>
                    <td className="px-3 py-1.5 text-right font-medium">{$0(x.value)}</td>
                    <td className="px-3 py-1.5 text-right">{pct1(x.pct)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Tarjeta>

      {/* PANEL 5 */}
      <Tarjeta titulo="Comparativa con el mercado gastronómico argentino"
        subtitulo="Rangos de referencia editables. Ajustalos si tenés datos propios del rubro.">
        <div className="overflow-x-auto rounded border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead style={{ backgroundColor: NAVY }}>
              <tr className="text-left text-xs uppercase tracking-wide text-white">
                <th className="px-3 py-2.5">Indicador</th>
                <th className="px-3 py-2.5 text-center">Rango de mercado</th>
                <th className="px-3 py-2.5 text-right">Tu negocio</th>
                <th className="px-3 py-2.5">Estado</th>
              </tr>
            </thead>
            <tbody>
              {cfg.benchmarks.map((b, i) => {
                const v = valores[b.id];
                let estado = "Sin datos", color = "#64748b", bg = "#f1f5f9";
                if (v != null && !isNaN(v)) {
                  const bueno = b.mejorEs === "alto";
                  if (v > b.max) { estado = "Por encima del promedio"; color = bueno ? VERDE : ROJO; bg = bueno ? VERDE_BG : ROJO_BG; }
                  else if (v < b.min) { estado = "Por debajo del promedio"; color = bueno ? ROJO : VERDE; bg = bueno ? ROJO_BG : VERDE_BG; }
                  else { estado = "En línea con el mercado"; color = AMARILLO; bg = AMARILLO_BG; }
                }
                return (
                  <tr key={b.id} className={i % 2 ? "bg-gray-50 dark:bg-gray-700/40" : "bg-white dark:bg-gray-800"}>
                    <td className="px-3 py-2 font-medium">{b.nombre}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-center gap-1">
                        <input type="number" className="w-16 rounded border border-gray-300 dark:border-gray-600 px-2 py-1 text-right text-sm"
                          value={b.min} onChange={(e) => setBench(b.id, "min", e.target.value)} />
                        <span className="text-gray-500 dark:text-gray-400">a</span>
                        <input type="number" className="w-16 rounded border border-gray-300 dark:border-gray-600 px-2 py-1 text-right text-sm"
                          value={b.max} onChange={(e) => setBench(b.id, "max", e.target.value)} />
                        <span className="text-gray-500 dark:text-gray-400">%</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right text-base font-bold" style={{ color: NAVY_TEXT }}>{v == null ? "—" : pct1(v)}</td>
                    <td className="px-3 py-2"><Chip color={color} bg={bg}>{estado}</Chip></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Formula>
          Food cost y costos laborales se calculan sobre facturación neta (sin IVA). Si comparás contra datos de cámara que
          usan facturación bruta, los porcentajes te van a dar más bajos.
        </Formula>
      </Tarjeta>

      {/* PANEL 6 */}
      <Tarjeta titulo="Evolución del costo de la carta"
        subtitulo="Costo mensual de ingredientes de todo el menú, valuado con los precios vigentes en cada fecha.">
        {evolucion.length < 2 ? (
          <p className="rounded border border-dashed border-gray-300 dark:border-gray-600 p-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Todavía no hay historial suficiente. Cada vez que actualices un precio, la app guarda el dato y arma la serie.
          </p>
        ) : (
          <>
            <LineaSVG data={evolucion} valueKey="costo" labelKey="fecha" color={NAVY} valueFmt={(v) => "$" + nf0.format(v / 1000) + "k"} />
            {varEvol != null && (
              <p className="mt-2 text-sm">
                Variación acumulada del período: <b style={{ color: varEvol > 0 ? ROJO : VERDE }}>{(varEvol > 0 ? "+" : "") + pct1(varEvol)}</b>.
                Si tus precios de carta no subieron al menos lo mismo, tu margen se achicó.
              </p>
            )}
          </>
        )}
      </Tarjeta>

        </div>
      </div>
    </>
  );
}

export default SeccionReportes;
