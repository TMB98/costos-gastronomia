import React from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "./icons.jsx";

// <th> clickeable para ordenar una tabla por esa columna. Muestra una flecha
// llena en la columna activa (según la dirección) y una flecha doble tenue
// en las demás, para que se note que también se puede ordenar por ahí.
function ThOrdenable({ clave, columna, direccion, onOrdenar, align = "left", className = "", children }) {
  const activo = columna === clave;
  return (
    <th
      className={`px-3 py-2.5 cursor-pointer select-none hover:bg-white/10 ${align === "right" ? "text-right" : ""} ${className}`}
      onClick={() => onOrdenar(clave)}
    >
      <span className={`inline-flex items-center gap-1 ${align === "right" ? "flex-row-reverse" : ""}`}>
        {children}
        {activo
          ? (direccion === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />)
          : <ChevronsUpDown size={13} className="opacity-40" />}
      </span>
    </th>
  );
}

export default ThOrdenable;
