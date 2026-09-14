import { useState, useEffect } from "react";

// Detecta si el navegador tiene conexión, usando los eventos nativos
// "online"/"offline" del navegador (no hace ningún pedido de red propio).
// No es 100% infalible (un wifi conectado a un router sin internet real
// puede reportar "online" igual), pero cubre el caso más común: se cortó
// la conexión del dispositivo.
export function useEnLinea() {
  const [enLinea, setEnLinea] = useState(navigator.onLine);

  useEffect(() => {
    const marcarOnline = () => setEnLinea(true);
    const marcarOffline = () => setEnLinea(false);
    window.addEventListener("online", marcarOnline);
    window.addEventListener("offline", marcarOffline);
    return () => {
      window.removeEventListener("online", marcarOnline);
      window.removeEventListener("offline", marcarOffline);
    };
  }, []);

  return enLinea;
}
