import React from "react";
import { NAVY } from "../config/constants.js";

function Boton({ children, onClick, variant = "primary", size = "md", type = "button", disabled }) {
  const base = "inline-flex items-center gap-1.5 rounded font-medium transition-colors disabled:opacity-50";
  const sizes = { sm: "px-2.5 py-1.5 text-xs", md: "px-3.5 py-2 text-sm" };
  const styles = {
    primary: { className: "text-white hover:opacity-90", style: { backgroundColor: NAVY } },
    ghost: { className: "border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/40", style: {} },
    danger: { className: "border border-red-200 bg-white dark:bg-gray-800 text-red-700 hover:bg-red-50", style: {} },
  }[variant];
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${sizes[size]} ${styles.className}`} style={styles.style}>
      {children}
    </button>
  );
}


export default Boton;
