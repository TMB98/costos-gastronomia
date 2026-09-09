import React, { useState } from "react";
import { inputCls, LISTA_UNIDADES } from "../../config/constants.js";
import { hoyISO, uid } from "../../lib/formato.js";
import { Check } from "../../components/icons.jsx";
import Modal from "../../components/Modal.jsx";
import Campo from "../../components/Campo.jsx";
import Boton from "../../components/Boton.jsx";
import SelectConAgregar from "../../components/SelectConAgregar.jsx";

function ModalIngrediente({ inicial, categorias, onAgregarCategoria, onGuardar, onClose }) {
  const [f, setF] = useState(
    inicial || { nombre: "", categoria: "Secos", unidad: "kg", precio: "", proveedor: "", fechaPrecio: hoyISO(), historial: [] }
  );
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const guardar = () => {
    if (!f.nombre.trim()) return;
    const precio = f.precio === "" || f.precio == null ? null : Number(f.precio);
    const cambio = !inicial || Number(inicial.precio) !== precio;
    // Si el precio cambió, la fecha del cambio es HOY — antes se guardaba con la
    // fecha vieja del ingrediente, lo que podía pisar un punto de historial en
    // vez de agregar uno nuevo.
    const fechaPrecio = cambio && precio != null ? hoyISO() : f.fechaPrecio;
    let historial = f.historial ? [...f.historial] : [];
    if (precio != null && cambio) {
      historial = historial.filter((h) => h.fecha !== fechaPrecio);
      historial.push({ fecha: fechaPrecio, precio });
      historial.sort((a, b) => a.fecha.localeCompare(b.fecha));
    }
    onGuardar({ ...f, precio, fechaPrecio, historial, id: f.id || uid("i") });
  };
  return (
    <Modal title={inicial ? "Editar ingrediente" : "Nuevo ingrediente"} onClose={onClose}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo label="Nombre" className="sm:col-span-2">
          <input className={inputCls} value={f.nombre} onChange={(e) => set("nombre", e.target.value)} placeholder="Harina 000" />
        </Campo>
        <Campo label="Categoría">
          <SelectConAgregar value={f.categoria} onChange={(v) => set("categoria", v)} opciones={categorias} onAgregarOpcion={onAgregarCategoria} />
        </Campo>
        <Campo label="Unidad de compra">
          <select className={inputCls} value={f.unidad} onChange={(e) => set("unidad", e.target.value)}>
            {LISTA_UNIDADES.map((u) => <option key={u}>{u}</option>)}
          </select>
        </Campo>
        <Campo label="Precio por unidad ($)" hint="Dejalo vacío si todavía no lo tenés: la app lo marca en rojo.">
          <input type="number" step="0.01" className={inputCls} value={f.precio ?? ""} onChange={(e) => set("precio", e.target.value)} />
        </Campo>
        <Campo label="Fecha del precio">
          <input type="date" className={inputCls} value={f.fechaPrecio || hoyISO()} onChange={(e) => set("fechaPrecio", e.target.value)} />
        </Campo>
        <Campo label="Proveedor (opcional)" className="sm:col-span-2">
          <input className={inputCls} value={f.proveedor || ""} onChange={(e) => set("proveedor", e.target.value)} />
        </Campo>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Boton variant="ghost" onClick={onClose}>Cancelar</Boton>
        <Boton onClick={guardar}><Check size={15} /> Guardar ingrediente</Boton>
      </div>
    </Modal>
  );
}

export default ModalIngrediente;
