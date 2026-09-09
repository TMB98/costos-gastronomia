import React from "react";
import { NAVY_TEXT } from "../config/constants.js";

function AyudaSeccion({ id, objetivo, pasos, cfg, setCfg }) {
  const colapsada = !!(cfg.ayudaColapsada && cfg.ayudaColapsada[id]);
  const toggle = () => setCfg("ayudaColapsada", { ...(cfg.ayudaColapsada || {}), [id]: !colapsada });
  return (
    <div className="mb-4 overflow-hidden rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
      <button
        onClick={toggle}
        className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left hover:bg-blue-100 hover:bg-opacity-40"
      >
        <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: NAVY_TEXT }}>
          🎯 {colapsada ? "¿Para qué sirve esta sección?" : "Objetivo de esta sección"}
        </span>
        <span className="shrink-0 text-xs font-medium text-blue-600 dark:text-blue-400">
          {colapsada ? "Mostrar ▾" : "Ocultar ▴"}
        </span>
      </button>
      {!colapsada && (
        <div className="px-4 pb-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">{objetivo}</p>
          <p className="mb-1 mt-3 text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
            Cómo usarla
          </p>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-gray-700 dark:text-gray-300">
            {pasos.map((p, i) => <li key={i}>{p}</li>)}
          </ol>
        </div>
      )}
    </div>
  );
}


export default AyudaSeccion;
