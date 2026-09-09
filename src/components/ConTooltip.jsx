import React, { useState } from "react";

function ConTooltip({ texto, children, posicion = "arriba" }) {
  const [visible, setVisible] = useState(false);
  const esAbajo = posicion === "abajo";
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span
          role="tooltip"
          className={`pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded px-2 py-1 text-xs font-medium text-white shadow-lg ${
            esAbajo ? "top-full mt-1.5" : "bottom-full mb-1.5"
          }`}
          style={{ backgroundColor: "#1e293b" }}
        >
          {texto}
        </span>
      )}
    </span>
  );
}


export default ConTooltip;
