import React from "react";
import { NAVY, VERDE, VERDE_BG } from "../config/constants.js";
import { ClipboardList, Check } from "../components/icons.jsx";

function ChecklistPrimerosPasos({ data, cfg, setCfg, setTab }) {
  if (cfg.ocultarChecklist) return null;

  const pasos = [
    { id: "ing", label: "Cargar tus primeras materias primas", hecho: data.ingredientes.length > 0, tab: "materias" },
    { id: "platos", label: "Armar tu primer plato con receta", hecho: data.platos.length > 0, tab: "platos" },
    { id: "fijos", label: "Cargar tus costos fijos (alquiler, sueldos, etc.)", hecho: data.costosFijos.length > 0, tab: "fijos" },
    { id: "ventas", label: "Registrar tu primera venta real", hecho: (data.ventas || []).length > 0, tab: "ventas" },
  ];
  const hechos = pasos.filter((p) => p.hecho).length;
  if (hechos === pasos.length) return null; // ya completó todo, no molestamos más

  return (
    <div className="mb-5 overflow-hidden rounded-lg border border-blue-200 bg-white dark:bg-gray-800 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between px-5 py-3" style={{ backgroundColor: NAVY }}>
        <span className="flex items-center gap-2 text-sm font-bold text-white">
          <ClipboardList size={16} /> Primeros pasos ({hechos}/{pasos.length})
        </span>
        <button onClick={() => setCfg("ocultarChecklist", true)} className="text-xs font-medium text-blue-100 hover:text-white">
          Ocultar
        </button>
      </div>
      <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-700">
        <div className="h-1.5 transition-all" style={{ width: `${(hechos / pasos.length) * 100}%`, backgroundColor: VERDE }} />
      </div>
      <ul className="divide-y divide-gray-100 dark:divide-gray-700">
        {pasos.map((p) => (
          <li key={p.id}>
            <button
              onClick={() => setTab(p.tab)}
              className="flex w-full items-center gap-3 px-5 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                style={p.hecho ? { backgroundColor: VERDE_BG, color: VERDE } : { backgroundColor: "#f1f5f9", color: "#94a3b8" }}
              >
                {p.hecho ? <Check size={12} /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
              </span>
              <span className={p.hecho ? "text-gray-400 line-through dark:text-gray-500 dark:text-gray-400" : "text-gray-700 dark:text-gray-200"}>
                {p.label}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ChecklistPrimerosPasos;
