import React, { useState } from "react";
import { X, Check } from "./icons.jsx";
import ConTooltip from "./ConTooltip.jsx";
import { inputCls } from "../config/constants.js";

function SelectConAgregar({ value, onChange, opciones, onAgregarOpcion }) {
  const [agregando, setAgregando] = useState(false);
  const [nuevo, setNuevo] = useState("");

  const confirmar = () => {
    const nombre = nuevo.trim();
    if (!nombre) { setAgregando(false); return; }
    if (!opciones.includes(nombre)) onAgregarOpcion(nombre);
    onChange(nombre);
    setAgregando(false); setNuevo("");
  };
  const cancelar = () => { setAgregando(false); setNuevo(""); };

  if (agregando) {
    return (
      <div className="flex gap-1">
        <input
          autoFocus className={inputCls} placeholder="Nombre de la categoría" value={nuevo}
          onChange={(e) => setNuevo(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); confirmar(); } if (e.key === "Escape") cancelar(); }}
        />
        <ConTooltip texto="Agregar esta categoría">
          <button type="button" onClick={confirmar} className="shrink-0 rounded border px-2 text-green-700 hover:bg-green-50" style={{ borderColor: "#bbf7d0" }} title="Agregar">
            <Check size={14} />
          </button>
        </ConTooltip>
        <ConTooltip texto="Cancelar">
          <button type="button" onClick={cancelar} className="shrink-0 rounded border px-2 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/40" title="Cancelar">
            <X size={14} />
          </button>
        </ConTooltip>
      </div>
    );
  }
  return (
    <div className="flex gap-1">
      <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value)}>
        {opciones.map((c) => <option key={c}>{c}</option>)}
      </select>
      <ConTooltip texto="Agregar una categoría nueva">
        <button
          type="button" onClick={() => setAgregando(true)}
          className="shrink-0 rounded border border-gray-300 dark:border-gray-600 px-2.5 text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/40"
          title="Agregar una categoría nueva"
        >
          +
        </button>
      </ConTooltip>
    </div>
  );
}


export default SelectConAgregar;
