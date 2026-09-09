import React, { useState } from "react";
import { NAVY, NAVY_BG_SOFT, NAVY_TEXT, inputCls } from "../config/constants.js";
import { BookOpen, X } from "../components/icons.jsx";
import ConTooltip from "../components/ConTooltip.jsx";
import MANUAL from "./manualContenido.js";

function ModalManual({ onClose }) {
  const [temaId, setTemaId] = useState(MANUAL[0].id);
  const [detalleAbierto, setDetalleAbierto] = useState({});
  const tema = MANUAL.find((m) => m.id === temaId) || MANUAL[0];
  const verDetalle = !!detalleAbierto[tema.id];
  const hayMasContenido = tema.detalle.length > 0 || tema.tips.length > 0;

  return (
    <div className="animate-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-3 sm:p-6">
      <div className="animate-modal-panel flex h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl dark:bg-gray-800">
        <div className="flex shrink-0 items-center justify-between px-5 py-3" style={{ backgroundColor: NAVY }}>
          <span className="flex items-center gap-2 text-base font-semibold text-white">
            <BookOpen size={18} /> Manual de usuario
          </span>
          <ConTooltip texto="Cerrar" posicion="abajo">
            <button onClick={onClose} className="rounded p-1 text-white hover:bg-white hover:bg-opacity-20" title="Cerrar">
              <X size={18} />
            </button>
          </ConTooltip>
        </div>

        {/* Selector de tema en mobile (la barra lateral se oculta en pantallas chicas) */}
        <div className="shrink-0 border-b border-gray-200 p-3 dark:border-gray-700 sm:hidden">
          <select
            className={inputCls}
            value={temaId}
            onChange={(e) => setTemaId(e.target.value)}
          >
            {MANUAL.map((m) => <option key={m.id} value={m.id}>{m.titulo}</option>)}
          </select>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="hidden w-60 shrink-0 overflow-y-auto border-r border-gray-200 bg-gray-50 py-2 dark:border-gray-700 dark:bg-gray-900/40 sm:block">
            {MANUAL.map((m) => {
              const Ic = m.icon;
              const activo = m.id === temaId;
              return (
                <button
                  key={m.id}
                  onClick={() => setTemaId(m.id)}
                  className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm ${activo ? "" : "text-gray-600 dark:text-gray-300"}`}
                  style={activo ? { backgroundColor: NAVY_BG_SOFT, color: NAVY_TEXT, fontWeight: 600 } : {}}
                >
                  <Ic size={15} className={activo ? "" : "text-gray-400"} />
                  {m.titulo}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto p-5 sm:p-6">
            <h3 className="mb-2 flex items-center gap-2 text-lg font-bold" style={{ color: NAVY_TEXT }}>
              <tema.icon size={20} />
              {tema.titulo}
            </h3>
            <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{tema.resumen}</p>

            {hayMasContenido && (
              <button
                onClick={() => setDetalleAbierto((d) => ({ ...d, [tema.id]: !verDetalle }))}
                className="mt-3 text-xs font-semibold"
                style={{ color: "#2563eb" }}
              >
                {verDetalle ? "Ocultar guía completa ▴" : "Ver guía completa ▾"}
              </button>
            )}

            {verDetalle && (
              <div className="mt-3 space-y-3 border-t border-gray-100 pt-3 dark:border-gray-700">
                {tema.detalle.map((p, i) => (
                  <p key={i} className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{p}</p>
                ))}
                {tema.tips.length > 0 && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
                    <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">Tips</p>
                    <ul className="space-y-1.5">
                      {tema.tips.map((t, i) => (
                        <li key={i} className="flex gap-1.5 text-xs text-amber-800 dark:text-amber-300">
                          <span>•</span><span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModalManual;
