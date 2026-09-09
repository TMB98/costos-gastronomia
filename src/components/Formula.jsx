import React from "react";
import { Info } from "./icons.jsx";

function Formula({ children }) {
  return (
    <p className="mt-0.5 flex items-start gap-1 text-xs italic text-gray-500 dark:text-gray-400">
      <Info size={12} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

/* ══════════════════════════════════════════════════════════════
   MODALES DE CARGA
   ══════════════════════════════════════════════════════════════ */

export default Formula;
