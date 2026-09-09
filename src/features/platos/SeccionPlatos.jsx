import React, { useState } from "react";
import { usePuedeEditar } from "../../auth/usuarios.js";
import { CAT_PLATO, NAVY_TEXT, ROJO, ROJO_BG, inputCls } from "../../config/constants.js";
import { $, pct1, nf2 } from "../../lib/formato.js";
import { Plus, Search, UtensilsCrossed, Pencil, Copy, Trash2 } from "../../components/icons.jsx";
import AyudaSeccion from "../../components/AyudaSeccion.jsx";
import Tarjeta from "../../components/Tarjeta.jsx";
import Boton from "../../components/Boton.jsx";
import ConTooltip from "../../components/ConTooltip.jsx";
import Formula from "../../components/Formula.jsx";
import Chip from "../../components/Chip.jsx";

function SeccionPlatos({ platosCalc, cfg, setCfg, setModal, borrar, duplicarPlato }) {
  const puedeEditar = usePuedeEditar();
  const [abierto, setAbierto] = useState(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("Todas");
  const lista = platosCalc.filter(
    (p) => (cat === "Todas" || p.categoria === cat) && p.nombre.toLowerCase().includes(q.toLowerCase())
  );
  return (
    <>
      <AyudaSeccion
        id="platos"
        cfg={cfg} setCfg={setCfg}
        objetivo="Acá armás cada receta del menú: qué ingredientes lleva, en qué cantidad, y a qué precio la vendés. La app calcula sola el costo y el margen de cada plato."
        pasos={[
          "Elegí los ingredientes de la receta (primero tienen que estar cargados en Materias primas).",
          "Cargá cuántas porciones rinde la receta completa — de ahí sale el costo por porción.",
          "Poné el precio de venta actual para ver el margen real y el semáforo de rentabilidad.",
        ]}
      />
    <Tarjeta
      titulo="Platos del menú"
      subtitulo={`${platosCalc.length} platos · margen bruto = (precio neto − costo de ingredientes) / precio neto`}
      extra={puedeEditar ? <Boton size="sm" onClick={() => setModal({ tipo: "plato" })}><Plus size={14} /> Agregar plato</Boton> : null}
    >
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative w-full flex-1 sm:w-64">
          <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
          <input className={inputCls + " pl-9"} placeholder="Buscar plato por nombre…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className={inputCls + " w-auto"} value={cat} onChange={(e) => setCat(e.target.value)}>
          <option>Todas</option>
          {(cfg.categoriasPlatos || CAT_PLATO).map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div className="space-y-3">
        {lista.map((p) => (
          <article key={p.id} className="rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap items-center gap-3 p-4">
              {p.foto ? (
                <img src={p.foto} alt="" className="h-14 w-14 rounded object-cover" onError={(e) => (e.target.style.display = "none")} />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded bg-gray-100 dark:bg-gray-900 text-gray-400"><UtensilsCrossed size={20} /></div>
              )}
              <div className="w-full flex-1 sm:w-auto">
                <h3 className="font-semibold" style={{ color: NAVY_TEXT }}>{p.nombre}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {p.categoria} · rinde {p.porciones} porción(es) · {p.tiempo || 0} min
                </p>
                {p.descripcion && <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">{p.descripcion}</p>}
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
                <div><p className="text-xs text-gray-500 dark:text-gray-400">Costo receta</p><p className="font-semibold">{p.incompleto ? "Incompleto" : $(p.costoTotal)}</p></div>
                <div><p className="text-xs text-gray-500 dark:text-gray-400">Costo/porción</p><p className="font-semibold">{p.incompleto ? "—" : $(p.costoPorcion)}</p></div>
                <div><p className="text-xs text-gray-500 dark:text-gray-400">Precio venta</p><p className="font-semibold">{$(p.precioVenta)}</p></div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Margen bruto</p>
                  <p className="font-semibold" style={{ color: p.sem.color }}>{p.sem.emoji} {p.margen == null ? "—" : pct1(p.margen)}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Boton size="sm" variant="ghost" onClick={() => setAbierto(abierto === p.id ? null : p.id)}>
                  {abierto === p.id ? "Ocultar" : "Ver receta"}
                </Boton>
                {puedeEditar && (
                  <>
                    <ConTooltip texto="Editar este plato">
                      <button onClick={() => setModal({ tipo: "plato", item: p })} className="rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700" style={{ color: NAVY_TEXT }} title="Editar este plato"><Pencil size={16} /></button>
                    </ConTooltip>
                    <ConTooltip texto="Duplicar este plato">
                      <button onClick={() => duplicarPlato(p)} className="rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700" style={{ color: NAVY_TEXT }} title="Duplicar este plato"><Copy size={16} /></button>
                    </ConTooltip>
                    <ConTooltip texto="Eliminar este plato">
                      <button onClick={() => borrar("platos", p.id, p.nombre)} className="rounded p-1.5 text-red-600 hover:bg-red-50" title="Eliminar este plato"><Trash2 size={16} /></button>
                    </ConTooltip>
                  </>
                )}
              </div>
            </div>

            {p.incompleto && (
              <div className="mx-4 mb-3 rounded px-3 py-2 text-xs font-medium" style={{ backgroundColor: ROJO_BG, color: ROJO }}>
                🔴 Costo incompleto: {p.errores.join(" · ")}
              </div>
            )}

            {abierto === p.id && (
              <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/40 p-4">
                <div className="overflow-x-auto rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-gray-900">
                      <tr className="text-left text-xs uppercase text-gray-600 dark:text-gray-400">
                        <th className="px-3 py-2">Ingrediente</th>
                        <th className="px-3 py-2 text-right">Cantidad</th>
                        <th className="px-3 py-2 text-right">Precio unitario</th>
                        <th className="px-3 py-2 text-right">Costo parcial</th>
                      </tr>
                    </thead>
                    <tbody>
                      {p.detalle.map((d, i) => (
                        <tr key={d.id} className={i % 2 ? "bg-gray-50 dark:bg-gray-700/40" : "bg-white dark:bg-gray-800"}>
                          <td className="px-3 py-1.5">{d.ing?.nombre || "—"}</td>
                          <td className="px-3 py-1.5 text-right">{nf2.format(Number(d.cantidad))} {d.unidad}</td>
                          <td className="px-3 py-1.5 text-right">{d.ing?.precio == null ? "—" : `${$(d.ing.precio)} / ${d.ing.unidad}`}</td>
                          <td className="px-3 py-1.5 text-right font-medium" style={{ color: d.error ? ROJO : undefined }}>
                            {d.error ? "🔴 " + d.error : $(d.costo)}
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t border-gray-300 dark:border-gray-600 font-semibold">
                        <td className="px-3 py-2" colSpan={3}>Costo total de la receta</td>
                        <td className="px-3 py-2 text-right">{$(p.costoTotal)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Precio neto (sin IVA)</p>
                    <p className="font-bold" style={{ color: NAVY_TEXT }}>{$(p.neto)}</p>
                    <Formula>Precio cargado {cfg.preciosIncluyenIVA ? `/ 1,${cfg.iva}` : "sin IVA"}</Formula>
                  </div>
                  <div className="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Ganancia por porción</p>
                    <p className="font-bold">{p.incompleto ? "—" : $(p.neto - p.costoPorcion)}</p>
                    <Formula>Precio neto − costo por porción</Formula>
                  </div>
                  <div className="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Margen bruto</p>
                    <p className="font-bold" style={{ color: p.sem.color }}>{p.margen == null ? "—" : pct1(p.margen)}</p>
                    <Formula>(Precio neto − costo) / precio neto × 100</Formula>
                  </div>
                  <div className="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Semáforo</p>
                    <Chip color={p.sem.color} bg={p.sem.bg}>{p.sem.emoji} {p.sem.label}</Chip>
                    <Formula>🟢 &gt;65% · 🟡 40–65% · 🔴 &lt;40%</Formula>
                  </div>
                </div>

                {p.notas && (
                  <div className="mt-3 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
                    <p className="mb-1 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Receta</p>
                    <p className="whitespace-pre-line text-sm text-gray-700 dark:text-gray-300">{p.notas}</p>
                  </div>
                )}
              </div>
            )}
          </article>
        ))}
        {lista.length === 0 && platosCalc.length > 0 && (
          <p className="rounded border border-dashed border-gray-300 dark:border-gray-600 p-8 text-center text-sm text-gray-500 dark:text-gray-400">
            No hay platos que coincidan con la búsqueda.
          </p>
        )}
        {platosCalc.length === 0 && (
          <p className="rounded border border-dashed border-gray-300 dark:border-gray-600 p-8 text-center text-sm text-gray-500 dark:text-gray-400">
            Todavía no hay platos. Agregá el primero para empezar a costear.
          </p>
        )}
      </div>
    </Tarjeta>
    </>
  );
}

export default SeccionPlatos;
