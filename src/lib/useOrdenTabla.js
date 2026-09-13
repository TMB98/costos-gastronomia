import { useState } from "react";

// Maneja el estado de "qué columna está ordenada y en qué dirección".
// Clickear la misma columna alterna asc/desc; clickear una columna distinta
// arranca en ascendente. El mismo hook sirve tanto para el click en el header
// de una tabla como para un selector "Ordenar por" fuera de una tabla.
export function useOrdenTabla(columnaInicial = null, direccionInicial = "asc") {
  const [columna, setColumna] = useState(columnaInicial);
  const [direccion, setDireccion] = useState(direccionInicial);

  const ordenarPor = (clave) => {
    if (columna === clave) {
      setDireccion((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setColumna(clave);
      setDireccion("asc");
    }
  };

  return { columna, direccion, ordenarPor, setDireccion };
}
