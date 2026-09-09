import React from "react";
import { NAVY } from "../config/constants.js";

function KPI({ label, valor, detalle, color }) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold" style={{ color: color || NAVY }}>{valor}</p>
      {detalle && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{detalle}</p>}
    </div>
  );
}


export default KPI;
