import React, { useState, useMemo } from "react";
import { inputCls, LISTA_UNIDADES, CAT_PLATO, NAVY, NAVY_TEXT, ROJO_TEXT, unidadesCompatibles } from "../../config/constants.js";
import { uid, $, pct1 } from "../../lib/formato.js";
import { calcPlato, netoDe, semaforo } from "../../lib/calculos.js";
import { Plus, Trash2, Check } from "../../components/icons.jsx";
import Modal from "../../components/Modal.jsx";
import Campo from "../../components/Campo.jsx";
import Boton from "../../components/Boton.jsx";
import SelectConAgregar from "../../components/SelectConAgregar.jsx";
import ConTooltip from "../../components/ConTooltip.jsx";

function ModalPlato({ inicial, ingredientes, config, onAgregarCategoria, onGuardar, onClose }) {
  const [f, setF] = useState(
    inicial || {
      nombre: "", categoria: "Principal", descripcion: "", foto: "",
      porciones: 1, tiempo: 0, notas: "", precioVenta: "", items: [],
    }
  );
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const mapIng = useMemo(() => Object.fromEntries(ingredientes.map((i) => [i.id, i])), [ingredientes]);
  const calc = calcPlato({ ...f, porciones: Number(f.porciones) || 1 }, mapIng);

  const addLinea = () => {
    const primero = ingredientes[0];
    set("items", [...f.items, { id: uid("l"), ingId: primero?.id || "", cantidad: 1, unidad: primero?.unidad || "kg" }]);
  };
  const setLinea = (id, k, v) =>
    set("items", f.items.map((it) => {
      if (it.id !== id) return it;
      const next = { ...it, [k]: v };
      if (k === "ingId") next.unidad = mapIng[v]?.unidad || "kg";
      return next;
    }));
  const delLinea = (id) => set("items", f.items.filter((it) => it.id !== id));

  const neto = netoDe(f.precioVenta, config);
  const margen = neto > 0 ? ((neto - calc.costoPorcion) / neto) * 100 : null;
  const sem = semaforo(calc.incompleto ? null : margen);

  return (
    <Modal wide title={inicial ? "Editar plato" : "Nuevo plato"} onClose={onClose}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Campo label="Nombre del plato" className="sm:col-span-2">
          <input className={inputCls} value={f.nombre} onChange={(e) => set("nombre", e.target.value)} placeholder="Chocotorta" />
        </Campo>
        <Campo label="Categoría">
          <SelectConAgregar value={f.categoria} onChange={(v) => set("categoria", v)} opciones={config.categoriasPlatos || CAT_PLATO} onAgregarOpcion={onAgregarCategoria} />
        </Campo>
        <Campo label="Descripción breve" className="sm:col-span-2">
          <input className={inputCls} value={f.descripcion} onChange={(e) => set("descripcion", e.target.value)} />
        </Campo>
        <Campo label="Foto (URL, opcional)">
          <input className={inputCls} value={f.foto} onChange={(e) => set("foto", e.target.value)} placeholder="https://..." />
        </Campo>
        <Campo label="Porciones que rinde">
          <input type="number" min="1" className={inputCls} value={f.porciones} onChange={(e) => set("porciones", e.target.value)} />
        </Campo>
        <Campo label="Preparación (minutos)">
          <input type="number" min="0" className={inputCls} value={f.tiempo} onChange={(e) => set("tiempo", e.target.value)} />
        </Campo>
        <Campo label="Precio de venta por porción ($)" hint={config.preciosIncluyenIVA ? "Cargado con IVA incluido" : "Cargado sin IVA"}>
          <input type="number" step="0.01" className={inputCls} value={f.precioVenta} onChange={(e) => set("precioVenta", e.target.value)} />
        </Campo>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-sm font-bold" style={{ color: NAVY_TEXT }}>Ingredientes de la receta</h4>
          <Boton size="sm" variant="ghost" onClick={addLinea}><Plus size={14} /> Agregar ingrediente</Boton>
        </div>
        {f.items.length === 0 ? (
          <p className="rounded border border-dashed border-gray-300 dark:border-gray-600 p-4 text-center text-sm text-gray-500 dark:text-gray-400">
            Todavía no hay ingredientes. Agregá el primero para calcular el costo.
          </p>
        ) : (
          <div className="overflow-x-auto rounded border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead style={{ backgroundColor: NAVY }}>
                <tr className="text-left text-xs uppercase tracking-wide text-white">
                  <th className="px-3 py-2">Ingrediente</th>
                  <th className="px-3 py-2 w-28">Cantidad</th>
                  <th className="px-3 py-2 w-28">Unidad</th>
                  <th className="px-3 py-2 w-36 text-right">Costo parcial</th>
                  <th className="px-3 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {calc.detalle.map((d, i) => (
                  <tr key={d.id} className={i % 2 ? "bg-gray-50 dark:bg-gray-700/40" : "bg-white dark:bg-gray-800"}>
                    <td className="px-3 py-1.5">
                      <select className={inputCls} value={d.ingId} onChange={(e) => setLinea(d.id, "ingId", e.target.value)}>
                        {ingredientes.map((ing) => <option key={ing.id} value={ing.id}>{ing.nombre}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-1.5">
                      <input type="number" step="0.001" className={inputCls} value={d.cantidad}
                        onChange={(e) => setLinea(d.id, "cantidad", e.target.value)} />
                    </td>
                    <td className="px-3 py-1.5">
                      <select className={inputCls} value={d.unidad} onChange={(e) => setLinea(d.id, "unidad", e.target.value)}>
                        {(d.ing ? unidadesCompatibles(d.ing.unidad) : LISTA_UNIDADES).map((u) => <option key={u}>{u}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      {d.error
                        ? <span className="text-xs font-semibold" style={{ color: ROJO_TEXT }}>🔴 {d.error}</span>
                        : <span className="font-medium">{$(d.costo)}</span>}
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      <ConTooltip texto="Quitar este ingrediente de la receta">
                        <button onClick={() => delLinea(d.id)} className="rounded p-1 text-red-600 hover:bg-red-50" title="Quitar este ingrediente de la receta"><Trash2 size={15} /></button>
                      </ConTooltip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/40 p-4 sm:grid-cols-4">
        <div>
          <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Costo total receta</p>
          <p className="text-lg font-bold" style={{ color: NAVY_TEXT }}>{$(calc.costoTotal)}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Costo por porción</p>
          <p className="text-lg font-bold" style={{ color: NAVY_TEXT }}>{$(calc.costoPorcion)}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Ganancia por porción</p>
          <p className="text-lg font-bold">{neto > 0 ? $(neto - calc.costoPorcion) : "—"}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Margen bruto</p>
          <p className="text-lg font-bold" style={{ color: sem.color }}>{sem.emoji} {calc.incompleto ? "—" : pct1(margen)}</p>
        </div>
        {calc.incompleto && (
          <p className="col-span-2 text-xs font-semibold sm:col-span-4" style={{ color: ROJO_TEXT }}>
            El costo está incompleto: hay {calc.errores.length} ingrediente(s) con problemas. Corregilos antes de fijar precio.
          </p>
        )}
      </div>

      <Campo label="Notas / receta paso a paso" className="mt-4">
        <textarea rows={4} className={inputCls} value={f.notas} onChange={(e) => set("notas", e.target.value)} />
      </Campo>

      <div className="mt-5 flex justify-end gap-2">
        <Boton variant="ghost" onClick={onClose}>Cancelar</Boton>
        <Boton onClick={() => f.nombre.trim() && onGuardar({ ...f, id: f.id || uid("p"), porciones: Number(f.porciones) || 1, precioVenta: Number(f.precioVenta) || 0 })}>
          <Check size={15} /> Guardar plato
        </Boton>
      </div>
    </Modal>
  );
}

export default ModalPlato;
