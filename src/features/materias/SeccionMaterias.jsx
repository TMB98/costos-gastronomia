import React, { useState } from "react";
import { usePuedeEditar } from "../../auth/usuarios.js";
import { CAT_ING, NAVY, NAVY_TEXT, ROJO, ROJO_BG, ROJO_TEXT, inputCls } from "../../config/constants.js";
import { fechaCorta, $ } from "../../lib/formato.js";
import { RefreshCw, Plus, Search, AlertTriangle, History, Pencil, Trash2 } from "../../components/icons.jsx";
import AyudaSeccion from "../../components/AyudaSeccion.jsx";
import Tarjeta from "../../components/Tarjeta.jsx";
import Boton from "../../components/Boton.jsx";
import ConTooltip from "../../components/ConTooltip.jsx";
import ModalHistorialPrecio from "./ModalHistorialPrecio.jsx";

function SeccionMaterias({ data, setModal, borrar, cfg, setCfg }) {
  const puedeEditar = usePuedeEditar();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("Todas");
  const [historialDe, setHistorialDe] = useState(null);
  const lista = data.ingredientes.filter(
    (i) => (cat === "Todas" || i.categoria === cat) && i.nombre.toLowerCase().includes(q.toLowerCase())
  );
  const sinPrecio = data.ingredientes.filter((i) => i.precio == null).length;

  return (
    <>
      <AyudaSeccion
        id="materias"
        cfg={cfg} setCfg={setCfg}
        objetivo="Acá cargás todos los ingredientes que usás en tus recetas, con su precio actualizado. Es la base de todo: sin esto cargado, la app no puede calcular el costo de ningún plato."
        pasos={[
          "Agregá cada ingrediente con su nombre, categoría, unidad de compra (kg, litro, unidad, etc.) y precio actual.",
          "Si todavía no sabés un precio, dejalo vacío — la app lo marca en rojo para que no se te pase por alto.",
          "Cuando suba un precio (inflación, cambio de proveedor), usá \"Actualizar precios\" para modificar varios de una categoría a la vez.",
        ]}
      />
    <Tarjeta
      titulo="Materias primas"
      subtitulo={`${data.ingredientes.length} ingredientes cargados${sinPrecio ? ` · ${sinPrecio} sin precio` : ""}`}
      extra={
        puedeEditar ? (
          <div className="flex gap-2">
            <Boton size="sm" variant="ghost" onClick={() => setModal({ tipo: "masivo" })}>
              <RefreshCw size={14} /> Actualizar precios
            </Boton>
            <Boton size="sm" onClick={() => setModal({ tipo: "ing" })}><Plus size={14} /> Agregar ingrediente</Boton>
          </div>
        ) : null
      }
    >
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative w-full flex-1 sm:w-64">
          <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
          <input className={inputCls + " pl-9"} placeholder="Buscar por nombre…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className={inputCls + " w-auto"} value={cat} onChange={(e) => setCat(e.target.value)}>
          <option>Todas</option>
          {(cfg.categoriasIngredientes || CAT_ING).map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      {sinPrecio > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded border px-3 py-2 text-sm" style={{ borderColor: "#fecaca", backgroundColor: ROJO_BG, color: ROJO }}>
          <AlertTriangle size={16} />
          Hay {sinPrecio} ingrediente(s) sin precio. Los platos que los usen muestran costo incompleto en lugar de un número equivocado.
        </div>
      )}

      {/* Tabla: solo en pantallas medianas o más grandes */}
      <div className="hidden overflow-x-auto rounded border border-gray-200 dark:border-gray-700 sm:block">
        <table className="w-full text-sm">
          <thead style={{ backgroundColor: NAVY }}>
            <tr className="text-left text-xs uppercase tracking-wide text-white">
              <th className="px-3 py-2.5">Ingrediente</th>
              <th className="px-3 py-2.5">Categoría</th>
              <th className="px-3 py-2.5">Unidad</th>
              <th className="px-3 py-2.5 text-right">Precio</th>
              <th className="px-3 py-2.5">Proveedor</th>
              <th className="px-3 py-2.5">Últ. actualización</th>
              <th className="px-3 py-2.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((i, idx) => (
              <tr key={i.id} className={idx % 2 ? "bg-gray-50 dark:bg-gray-700/40" : "bg-white dark:bg-gray-800"}>
                <td className="px-3 py-2 font-medium">{i.precio == null && "🔴 "}{i.nombre}</td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{i.categoria}</td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{i.unidad}</td>
                <td className="px-3 py-2 text-right font-medium">
                  {i.precio == null ? <span style={{ color: ROJO_TEXT }}>Sin precio</span> : $(i.precio)}
                </td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{i.proveedor || "—"}</td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{fechaCorta(i.fechaPrecio)}</td>
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-1">
                    <ConTooltip texto="Ver historial de precio">
                      <button onClick={() => setHistorialDe(i)} className="rounded p-1.5 text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-600" title="Ver historial de precio"><History size={15} /></button>
                    </ConTooltip>
                    {puedeEditar && (
                      <>
                        <ConTooltip texto="Editar este ingrediente">
                          <button onClick={() => setModal({ tipo: "ing", item: i })} className="rounded p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600" style={{ color: NAVY_TEXT }} title="Editar este ingrediente"><Pencil size={15} /></button>
                        </ConTooltip>
                        <ConTooltip texto="Eliminar este ingrediente">
                          <button onClick={() => borrar("ingredientes", i.id, i.nombre)} className="rounded p-1.5 text-red-600 hover:bg-red-50" title="Eliminar este ingrediente"><Trash2 size={15} /></button>
                        </ConTooltip>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {lista.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-gray-500 dark:text-gray-400">No hay ingredientes que coincidan con la búsqueda.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Tarjetas apiladas: solo en mobile, misma información sin scroll horizontal */}
      <div className="space-y-2.5 sm:hidden">
        {lista.map((i) => (
          <div key={i.id} className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-medium text-gray-900 dark:text-gray-100">{i.precio == null && "🔴 "}{i.nombre}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{i.categoria} · {i.unidad}</p>
              </div>
              <div className="shrink-0 text-right">
                {i.precio == null
                  ? <span className="text-sm font-semibold" style={{ color: ROJO_TEXT }}>Sin precio</span>
                  : <span className="text-sm font-bold" style={{ color: NAVY_TEXT }}>{$(i.precio)}</span>}
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2 dark:border-gray-700">
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {i.proveedor ? `${i.proveedor} · ` : ""}Act. {fechaCorta(i.fechaPrecio)}
              </p>
              <div className="flex gap-1">
                <button onClick={() => setHistorialDe(i)} className="rounded p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700" title="Ver historial de precio"><History size={15} /></button>
                {puedeEditar && (
                  <>
                    <button onClick={() => setModal({ tipo: "ing", item: i })} className="rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700" style={{ color: NAVY_TEXT }} title="Editar este ingrediente"><Pencil size={15} /></button>
                    <button onClick={() => borrar("ingredientes", i.id, i.nombre)} className="rounded p-1.5 text-red-600 hover:bg-red-50" title="Eliminar este ingrediente"><Trash2 size={15} /></button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
        {lista.length === 0 && (
          <p className="rounded border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
            No hay ingredientes que coincidan con la búsqueda.
          </p>
        )}
      </div>
    </Tarjeta>
    {historialDe && <ModalHistorialPrecio ingrediente={historialDe} onClose={() => setHistorialDe(null)} />}
    </>
  );
}

export default SeccionMaterias;
