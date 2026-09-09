import React, { useState } from "react";
import { inputCls, NAVY, VERDE, ROJO } from "../../config/constants.js";
import { hoyISO, $, pct1 } from "../../lib/formato.js";
import { RefreshCw, Check } from "../../components/icons.jsx";
import Modal from "../../components/Modal.jsx";
import Campo from "../../components/Campo.jsx";
import Boton from "../../components/Boton.jsx";

function ModalPreciosMasivo({ ingredientes, categorias, onAplicar, onClose }) {
  const [cat, setCat] = useState(categorias[0]);
  const [ajuste, setAjuste] = useState("");
  const [fecha, setFecha] = useState(hoyISO());
  const [valores, setValores] = useState({});

  const lista = ingredientes.filter((i) => i.categoria === cat);
  const valorDe = (i) => (valores[i.id] !== undefined ? valores[i.id] : i.precio ?? "");

  const aplicarPorcentaje = () => {
    const p = Number(ajuste);
    if (isNaN(p) || ajuste === "") return;
    const next = { ...valores };
    lista.forEach((i) => {
      const base = Number(valorDe(i));
      if (!isNaN(base) && valorDe(i) !== "") next[i.id] = Math.round(base * (1 + p / 100) * 100) / 100;
    });
    setValores(next);
  };

  return (
    <Modal wide title="Actualizar precios por categoría" onClose={onClose}>
      <div className="flex flex-wrap items-end gap-3">
        <Campo label="Categoría">
          <select className={inputCls} value={cat} onChange={(e) => { setCat(e.target.value); setValores({}); }}>
            {categorias.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Campo>
        <Campo label="Ajuste general (%)" hint="Ej: 12 aplica +12% a toda la categoría.">
          <input type="number" step="0.1" className={inputCls} value={ajuste} onChange={(e) => setAjuste(e.target.value)} placeholder="12" />
        </Campo>
        <Boton variant="ghost" onClick={aplicarPorcentaje}><RefreshCw size={14} /> Aplicar a la lista</Boton>
        <Campo label="Fecha del nuevo precio">
          <input type="date" className={inputCls} value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </Campo>
      </div>

      <div className="mt-4 max-h-80 overflow-x-auto overflow-y-auto rounded border border-gray-200 dark:border-gray-700">
        <table className="w-full min-w-[480px] text-sm">
          <thead className="sticky top-0" style={{ backgroundColor: NAVY }}>
            <tr className="text-left text-xs uppercase tracking-wide text-white">
              <th className="px-3 py-2">Ingrediente</th>
              <th className="px-3 py-2 w-32 text-right">Precio actual</th>
              <th className="px-3 py-2 w-40">Precio nuevo</th>
              <th className="px-3 py-2 w-24 text-right">Var.</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((i, idx) => {
              const nuevo = Number(valorDe(i));
              const viejo = Number(i.precio);
              const varr = viejo > 0 && !isNaN(nuevo) ? ((nuevo - viejo) / viejo) * 100 : null;
              return (
                <tr key={i.id} className={idx % 2 ? "bg-gray-50 dark:bg-gray-700/40" : "bg-white dark:bg-gray-800"}>
                  <td className="px-3 py-1.5">{i.nombre} <span className="text-xs text-gray-500 dark:text-gray-400">/ {i.unidad}</span></td>
                  <td className="px-3 py-1.5 text-right">{i.precio == null ? "🔴 sin precio" : $(i.precio)}</td>
                  <td className="px-3 py-1.5">
                    <input type="number" step="0.01" className={inputCls} value={valorDe(i)}
                      onChange={(e) => setValores({ ...valores, [i.id]: e.target.value })} />
                  </td>
                  <td className="px-3 py-1.5 text-right font-medium" style={{ color: varr > 0 ? ROJO : varr < 0 ? VERDE : "#6b7280" }}>
                    {varr == null ? "—" : (varr > 0 ? "+" : "") + pct1(varr)}
                  </td>
                </tr>
              );
            })}
            {lista.length === 0 && (
              <tr><td colSpan={4} className="px-3 py-6 text-center text-gray-500 dark:text-gray-400">No hay ingredientes en esta categoría.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <Boton variant="ghost" onClick={onClose}>Cancelar</Boton>
        <Boton onClick={() => onAplicar(valores, fecha)}><Check size={15} /> Guardar precios</Boton>
      </div>
    </Modal>
  );
}

export default ModalPreciosMasivo;
