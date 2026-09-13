import React, { useState, useMemo } from "react";
import { inputCls, LISTA_UNIDADES, AMARILLO, AMARILLO_BG } from "../../config/constants.js";
import { hoyISO, uid } from "../../lib/formato.js";
import { Check, AlertTriangle } from "../../components/icons.jsx";
import Modal from "../../components/Modal.jsx";
import Campo from "../../components/Campo.jsx";
import Boton from "../../components/Boton.jsx";
import SelectConAgregar from "../../components/SelectConAgregar.jsx";

// Compara nombres "a ojo": ignora mayúsculas/minúsculas y espacios de más.
// No detecta sinónimos ni variantes de marca — eso queda para cuando exista
// un catálogo maestro de verdad (ver ARCHITECTURE.md / pendientes).
const normalizar = (s) => (s || "").trim().toLowerCase().replace(/\s+/g, " ");

function ModalIngrediente({ inicial, categorias, existentes, onAgregarCategoria, onGuardar, onClose, onVerExistente }) {
  const [f, setF] = useState(
    inicial || { nombre: "", categoria: "Secos", unidad: "kg", precio: "", proveedor: "", fechaPrecio: hoyISO(), historial: [] }
  );
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const duplicado = useMemo(() => {
    const nombreNorm = normalizar(f.nombre);
    if (!nombreNorm || !existentes) return null;
    return existentes.find((i) => i.id !== f.id && normalizar(i.nombre) === nombreNorm) || null;
  }, [f.nombre, f.id, existentes]);

  const [guardando, setGuardando] = useState(false);
  const guardar = async () => {
    if (!f.nombre.trim() || guardando) return;
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
    setGuardando(true);
    try {
      await onGuardar({ ...f, precio, fechaPrecio, historial, id: f.id || uid("i") });
    } finally {
      setGuardando(false); // si falló y el modal sigue abierto, esto libera el botón para reintentar
    }
  };
  return (
    <Modal title={inicial ? "Editar ingrediente" : "Nuevo ingrediente"} onClose={onClose}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo label="Nombre" className="sm:col-span-2">
          <input className={inputCls} value={f.nombre} onChange={(e) => set("nombre", e.target.value)} placeholder="Harina 000" />
          {duplicado && (
            <div className="mt-2 flex flex-wrap items-center gap-2 rounded px-3 py-2 text-xs" style={{ backgroundColor: AMARILLO_BG, color: AMARILLO }}>
              <AlertTriangle size={14} className="shrink-0" />
              <span>Ya existe <b>"{duplicado.nombre}"</b> — ¿es el mismo producto?</span>
              {onVerExistente && (
                <button type="button" onClick={() => onVerExistente(duplicado)} className="font-semibold underline">
                  Ver ese ingrediente
                </button>
              )}
            </div>
          )}
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
        <Boton onClick={guardar} disabled={guardando}><Check size={15} /> {guardando ? "Guardando…" : "Guardar ingrediente"}</Boton>
      </div>
    </Modal>
  );
}

export default ModalIngrediente;
