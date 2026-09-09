import React, { useState } from "react";
import { inputCls, FRECUENCIAS, NAVY_TEXT } from "../../config/constants.js";
import { uid, $ } from "../../lib/formato.js";
import { cfMensual } from "../../lib/calculos.js";
import { Check } from "../../components/icons.jsx";
import Modal from "../../components/Modal.jsx";
import Campo from "../../components/Campo.jsx";
import Boton from "../../components/Boton.jsx";
import SelectConAgregar from "../../components/SelectConAgregar.jsx";

function ModalCostoFijo({ inicial, categorias, onAgregarCategoria, onGuardar, onClose }) {
  const [f, setF] = useState(inicial || { nombre: "", categoria: categorias[0], monto: "", frecuencia: "mensual", notas: "", proximoAjuste: "" });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  return (
    <Modal title={inicial ? "Editar costo fijo" : "Nuevo costo fijo"} onClose={onClose}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo label="Nombre del gasto" className="sm:col-span-2">
          <input className={inputCls} value={f.nombre} onChange={(e) => set("nombre", e.target.value)} placeholder="Alquiler del local" />
        </Campo>
        <Campo label="Categoría">
          <SelectConAgregar value={f.categoria} onChange={(v) => set("categoria", v)} opciones={categorias} onAgregarOpcion={onAgregarCategoria} />
        </Campo>
        <Campo label="Frecuencia" hint="Trimestral y anual se convierten solos a costo mensual.">
          <select className={inputCls} value={f.frecuencia} onChange={(e) => set("frecuencia", e.target.value)}>
            {Object.keys(FRECUENCIAS).map((x) => <option key={x}>{x}</option>)}
          </select>
        </Campo>
        <Campo label="Monto del período ($)">
          <input type="number" step="0.01" className={inputCls} value={f.monto} onChange={(e) => set("monto", e.target.value)} />
        </Campo>
        <Campo label="Equivale por mes a">
          <div className="rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/40 px-3 py-2 text-sm font-semibold" style={{ color: NAVY_TEXT }}>
            {$(cfMensual({ monto: f.monto, frecuencia: f.frecuencia }))}
          </div>
        </Campo>
        <Campo label="Próximo ajuste (opcional)" hint="Si este gasto tiene una fecha conocida de aumento (ej: contrato con ajuste trimestral), cargala acá y la app te avisa cuando se acerque.">
          <input type="date" className={inputCls} value={f.proximoAjuste || ""} onChange={(e) => set("proximoAjuste", e.target.value)} />
        </Campo>
        <Campo label="Notas (opcional)" className="sm:col-span-2">
          <input className={inputCls} value={f.notas || ""} onChange={(e) => set("notas", e.target.value)} />
        </Campo>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Boton variant="ghost" onClick={onClose}>Cancelar</Boton>
        <Boton onClick={() => f.nombre.trim() && onGuardar({ ...f, id: f.id || uid("c"), monto: Number(f.monto) || 0 })}>
          <Check size={15} /> Guardar costo
        </Boton>
      </div>
    </Modal>
  );
}

export default ModalCostoFijo;
