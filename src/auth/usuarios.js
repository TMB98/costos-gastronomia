import React, { useContext } from "react";

// Contexto de rol: para no tener que pasar los permisos como prop a mano por
// cada componente de la app, cualquier componente puede leerlo con estos hooks.
// El valor real llega desde la tabla "perfiles" de Supabase (ver AppConLogin.jsx),
// no desde localStorage ni desde ningún dato que el navegador pueda inventar.
// Por defecto "admin" (si algo se renderiza fuera del Provider por error,
// preferimos no bloquear antes que romper la app).
// - admin: puede tocar todo (catálogo + ventas).
// - cajero: puede cargar y corregir ventas, pero no toca Materias primas,
//   Platos, Costos fijos ni Pricing.
// - visualizador: solo puede mirar, no toca nada.
export const RolContext = React.createContext("admin");
export const usePuedeEditar = () => useContext(RolContext) === "admin"; // editar el catálogo (admin only)
export const usePuedeVentas = () => { const r = useContext(RolContext); return r === "admin" || r === "cajero"; }; // cargar/corregir ventas
export const useEsAdmin = () => useContext(RolContext) === "admin"; // ver el log de correcciones
