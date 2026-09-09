import React, { useMemo } from "react";
import { usePuedeEditar } from "../../auth/usuarios.js";
import { NAVY, NAVY_TEXT, ROJO, ROJO_BG, ROJO_TEXT, AMARILLO_BG, AMARILLO_TEXT, inputCls } from "../../config/constants.js";
import { $0, pct1 } from "../../lib/formato.js";
import { cfMensual, estadoAjuste } from "../../lib/calculos.js";
import { Plus, AlertTriangle, Pencil, Trash2 } from "../../components/icons.jsx";
import AyudaSeccion from "../../components/AyudaSeccion.jsx";
import KPI from "../../components/KPI.jsx";
import Tarjeta from "../../components/Tarjeta.jsx";
import Boton from "../../components/Boton.jsx";
import Campo from "../../components/Campo.jsx";
import ConTooltip from "../../components/ConTooltip.jsx";
import BarraH from "../../components/graficos/BarraH.jsx";

function SeccionFijos({ data, totalCF, setModal, borrar, cfg, setCfg }) {
  const puedeEditar = usePuedeEditar();
  const porCat = useMemo(() => {
    const m = {};
    data.costosFijos.forEach((c) => { m[c.categoria] = (m[c.categoria] || 0) + cfMensual(c); });
    return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [data.costosFijos]);

  const horasMes = (Number(cfg.horasPorDia) || 0) * (Number(cfg.diasPorMes) || 30);

  return (
    <>
      <AyudaSeccion
        id="fijos"
        cfg={cfg} setCfg={setCfg}
        objetivo="Todo lo que pagás aunque no vendas nada: alquiler, sueldos, servicios. Esto se reparte entre los platos en la pestaña Pricing para calcular el costo real de cada uno."
        pasos={[
          "Cargá cada gasto fijo con su monto y la frecuencia real (mensual, trimestral o anual).",
          "La app convierte todo a valor mensual automáticamente — no hace falta que hagas la cuenta vos.",
          "Mirá el gráfico de torta para ver rápido en qué categoría se va más la plata.",
        ]}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <KPI label="Costo fijo mensual" valor={$0(totalCF)} detalle={`${data.costosFijos.length} conceptos`} />
        <KPI label="Costo fijo por día" valor={$0(totalCF / (Number(cfg.diasPorMes) || 30))} detalle={`Total / ${cfg.diasPorMes} días`} />
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500">
        Equivale a {$0(horasMes > 0 ? totalCF / horasMes : 0)} por hora abierta ({cfg.horasPorDia} h/día × {cfg.diasPorMes} días).
      </p>

      <Tarjeta
        titulo="Costos fijos mensuales"
        subtitulo="Los importes trimestrales y anuales se convierten automáticamente a valor mensual."
        extra={puedeEditar ? <Boton size="sm" onClick={() => setModal({ tipo: "cf" })}><Plus size={14} /> Agregar costo</Boton> : null}
      >
        <div className="mb-4 flex flex-wrap gap-4">
          <Campo label="Horas de apertura por día">
            <input type="number" min="1" max="24" className={inputCls + " w-32"} value={cfg.horasPorDia}
              onChange={(e) => setCfg("horasPorDia", Number(e.target.value))} />
          </Campo>
          <Campo label="Días abiertos por mes">
            <input type="number" min="1" max="31" className={inputCls + " w-32"} value={cfg.diasPorMes}
              onChange={(e) => setCfg("diasPorMes", Number(e.target.value))} />
          </Campo>
        </div>

        {/* Tabla: solo en pantallas medianas o más grandes */}
        <div className="hidden overflow-x-auto rounded border border-gray-200 dark:border-gray-700 sm:block">
          <table className="w-full text-sm">
            <thead style={{ backgroundColor: NAVY }}>
              <tr className="text-left text-xs uppercase tracking-wide text-white">
                <th className="px-3 py-2.5">Gasto</th>
                  <th className="px-3 py-2.5">Categoría</th>
                  <th className="px-3 py-2.5">Frec.</th>
                  <th className="px-3 py-2.5 text-right">Mensual</th>
                  <th className="px-3 py-2.5 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {data.costosFijos.map((c, i) => {
                  const ajuste = estadoAjuste(c.proximoAjuste);
                  return (
                  <tr key={c.id} className={i % 2 ? "bg-gray-50 dark:bg-gray-700/40" : "bg-white dark:bg-gray-800"}>
                    <td className="px-3 py-2">
                      <span className="font-medium">{c.nombre}</span>
                      {c.notas && <span className="block text-xs text-gray-500 dark:text-gray-400">{c.notas}</span>}
                      {ajuste && (
                        <span
                          className="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                          style={ajuste.tipo === "vencido" ? { backgroundColor: ROJO_BG, color: ROJO_TEXT } : { backgroundColor: AMARILLO_BG, color: AMARILLO_TEXT }}
                        >
                          <AlertTriangle size={11} />
                          {ajuste.tipo === "vencido" ? `Ajuste vencido hace ${ajuste.dias} días` : `Ajuste en ${ajuste.dias} días`}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{c.categoria}</td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{c.frecuencia}</td>
                    <td className="px-3 py-2 text-right font-medium">{$0(cfMensual(c))}</td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-1">
                        {puedeEditar && (
                          <>
                            <ConTooltip texto="Editar este costo fijo">
                              <button onClick={() => setModal({ tipo: "cf", item: c })} className="rounded p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600" style={{ color: NAVY_TEXT }} title="Editar este costo fijo"><Pencil size={15} /></button>
                            </ConTooltip>
                            <ConTooltip texto="Eliminar este costo fijo">
                              <button onClick={() => borrar("costosFijos", c.id, c.nombre)} className="rounded p-1.5 text-red-600 hover:bg-red-50" title="Eliminar este costo fijo"><Trash2 size={15} /></button>
                            </ConTooltip>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                })}
                <tr className="border-t-2 font-bold" style={{ borderColor: NAVY }}>
                  <td className="px-3 py-2.5" colSpan={3}>Total mensual</td>
                  <td className="px-3 py-2.5 text-right" style={{ color: NAVY_TEXT }}>{$0(totalCF)}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>

          {/* Tarjetas apiladas: solo en mobile */}
          <div className="space-y-2.5 sm:hidden">
            {data.costosFijos.map((c) => {
              const ajuste = estadoAjuste(c.proximoAjuste);
              return (
              <div key={c.id} className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900 dark:text-gray-100">{c.nombre}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{c.categoria} · {c.frecuencia}</p>
                    {c.notas && <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{c.notas}</p>}
                    {ajuste && (
                      <span
                        className="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                        style={ajuste.tipo === "vencido" ? { backgroundColor: ROJO_BG, color: ROJO_TEXT } : { backgroundColor: AMARILLO_BG, color: AMARILLO_TEXT }}
                      >
                        <AlertTriangle size={11} />
                        {ajuste.tipo === "vencido" ? `Ajuste vencido hace ${ajuste.dias} días` : `Ajuste en ${ajuste.dias} días`}
                      </span>
                    )}
                  </div>
                  <span className="shrink-0 text-sm font-bold" style={{ color: NAVY_TEXT }}>{$0(cfMensual(c))}</span>
                </div>
                {puedeEditar && (
                  <div className="mt-2 flex items-center justify-end gap-1 border-t border-gray-100 pt-2 dark:border-gray-700">
                    <button onClick={() => setModal({ tipo: "cf", item: c })} className="rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700" style={{ color: NAVY_TEXT }} title="Editar este costo fijo"><Pencil size={15} /></button>
                    <button onClick={() => borrar("costosFijos", c.id, c.nombre)} className="rounded p-1.5 text-red-600 hover:bg-red-50" title="Eliminar este costo fijo"><Trash2 size={15} /></button>
                  </div>
                )}
              </div>
              );
            })}
            <div className="rounded-lg p-3 text-right font-bold text-white" style={{ backgroundColor: NAVY }}>
              Total mensual: {$0(totalCF)}
            </div>
          </div>

        <div className="mt-5 border-t border-gray-200 dark:border-gray-700 pt-5">
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
            <h3 className="mb-1.5 text-sm font-bold" style={{ color: NAVY_TEXT }}>💡 ¿Por qué importa este número?</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              El costo fijo es tu "piso": lo que tenés que pagar sí o sí cada mes, vendas mucho, poco o nada.
              Antes de pensar en ganancia, tu negocio tiene que cubrir esto primero. Cuanto más alto es ese piso,
              más rápido necesitás vender para no quedar corto — por eso conviene tenerlo siempre a la vista,
              no solo mirarlo una vez al año cuando ya es tarde para reaccionar.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">¿Qué categoría pesa más en tu costo fijo?</p>
              <BarraH data={porCat} valueFmt={(v) => `${$0(v)} (${pct1((v / (totalCF || 1)) * 100)})`} colorFn={() => NAVY} />
            </div>
            <div className="rounded-lg p-4" style={{ backgroundColor: NAVY }}>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-200">Lo mínimo que tenés que facturar</p>
              <p className="mt-1 text-2xl font-bold text-white">{$0(totalCF / (Number(cfg.diasPorMes) || 30))} por día</p>
              <p className="mt-2 text-xs text-blue-100">
                Es lo que necesitás vender cada día que abrís, solo para cubrir alquiler, sueldos y servicios
                — antes de contar ingredientes y antes de ver un peso de ganancia. Si un día vendés menos que esto,
                ese día perdiste plata aunque hayas facturado.
              </p>
            </div>
          </div>
        </div>
      </Tarjeta>
    </>
  );
}

export default SeccionFijos;
