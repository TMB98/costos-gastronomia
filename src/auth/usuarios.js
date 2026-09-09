import React, { useContext } from "react";

// OJO: cambiá estas contraseñas por las que quieras usar de verdad antes de
// compartir el link — estas son solo un punto de partida.
export const USUARIOS = [
  { usuario: "juani", clave: "costos2026", rol: "admin", nombre: "Juani" },
  { usuario: "novia", clave: "Admin2026n", rol: "admin", nombre: "Novia de Juani" },
  { usuario: "pastelera", clave: "Caja2026a", rol: "cajero", nombre: "Pastelera" },
  { usuario: "ayudante", clave: "Caja2026b", rol: "cajero", nombre: "Ayudante de pastelera" },
  { usuario: "invitado1", clave: "Ver2026a", rol: "visualizador", nombre: "Invitado 1" },
];

export const LOGIN_STORAGE_KEY = "gastro_login_ok";

// Contexto de rol: para no tener que pasar los permisos como prop a mano por
// cada componente de la app, cualquier componente puede leerlo con estos hooks.
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
