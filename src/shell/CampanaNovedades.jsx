import React, { useState } from "react";
import { NAVY, NAVY_TEXT } from "../config/constants.js";
import { Bell, X } from "../components/icons.jsx";
import ConTooltip from "../components/ConTooltip.jsx";
import NOVEDADES from "./novedadesContenido.js";

function CampanaNovedades({ cfg, setCfg }) {
  const [abierto, setAbierto] = useState(false);
  const totalItems = NOVEDADES.reduce((a, n) => a + n.items.length, 0);
  const vistas = cfg.novedadesVistas ?? 0;
  const hayNuevas = vistas < totalItems;

  const toggle = () => {
    const next = !abierto;
    setAbierto(next);
    if (next && hayNuevas) setCfg("novedadesVistas", totalItems);
  };

  return (
    <div className="relative">
      <ConTooltip texto="Ver novedades y últimos cambios de la app" posicion="abajo">
        <button
          onClick={toggle}
          className="relative rounded-full p-2 text-sm text-white hover:bg-white hover:bg-opacity-10"
          title="Ver novedades y últimos cambios de la app"
        >
          <Bell size={17} />
          {hayNuevas && (
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border border-white" style={{ backgroundColor: "#ef4444" }} />
          )}
        </button>
      </ConTooltip>
      {abierto && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setAbierto(false)} />
          <div className="fixed right-3 top-16 z-50 w-80 max-w-[90vw] overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-2xl sm:right-5 sm:top-20">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4 py-2.5" style={{ backgroundColor: NAVY }}>
              <span className="flex items-center gap-1.5 text-sm font-bold text-white"><Bell size={15} /> Novedades</span>
              <ConTooltip texto="Cerrar" posicion="abajo">
                <button onClick={() => setAbierto(false)} className="rounded p-0.5 text-white hover:bg-white hover:bg-opacity-20" title="Cerrar">
                  <X size={14} />
                </button>
              </ConTooltip>
            </div>
            <div className="max-h-96 overflow-y-auto p-4">
              {NOVEDADES.map((n, i) => (
                <div key={i} className={i > 0 ? "mt-4 border-t border-gray-100 dark:border-gray-700 pt-4" : ""}>
                  <p className="mb-1.5 flex items-baseline gap-2 text-xs font-bold uppercase tracking-wide" style={{ color: NAVY_TEXT }}>
                    <span>Versión {n.version}</span>
                    <span className="font-normal normal-case text-gray-400 dark:text-gray-500">· {n.fecha}</span>
                  </p>
                  <ul className="space-y-1.5">
                    {n.items.map((it, j) => (
                      <li key={j} className="flex gap-1.5 text-xs text-gray-700 dark:text-gray-300">
                        <span className="text-blue-600 dark:text-blue-400">•</span>
                        <span>{it}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default CampanaNovedades;
