import React, { useState, useContext } from "react";
import { NAVY_TEXT, APP_VERSION } from "../config/constants.js";
import { hoyISO } from "../lib/formato.js";
import datosDemo from "../lib/datosDemo.js";
import { BookOpen, Sun, Moon, Receipt, RotateCcw, LogOut, Settings, Lock, Upload } from "../components/icons.jsx";
import ConTooltip from "../components/ConTooltip.jsx";
import ModalManual from "./ModalManual.jsx";
import { usePuedeEditar, RolContext } from "../auth/usuarios.js";

function MenuConfiguracion({ data, setData, toast, setConfirmar, oscuro, setOscuro, usuarioActual, onCerrarSesion }) {
  const [abierto, setAbierto] = useState(false);
  const [manualAbierto, setManualAbierto] = useState(false);
  const puedeEditar = usePuedeEditar();
  const rol = useContext(RolContext);

  const descargarRespaldo = () => {
    try {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const fecha = hoyISO();
      a.href = url;
      a.download = `respaldo-costos-gastronomicos-${fecha}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast("💾 Respaldo descargado");
    } catch (e) {
      toast("⚠️ No se pudo generar el respaldo");
    }
    setAbierto(false);
  };

  const restaurarRespaldo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (!parsed || !parsed.ingredientes || !parsed.platos || !parsed.costosFijos || !parsed.config) {
          toast("⚠️ El archivo no tiene el formato esperado");
          return;
        }
        setData(parsed);
        toast("✅ Respaldo restaurado");
      } catch (err) {
        toast("⚠️ No se pudo leer el archivo");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
    setAbierto(false);
  };

  const restaurarEjemplo = () => {
    if (!puedeEditar) return;
    setAbierto(false);
    setConfirmar({
      msg: "Vas a reemplazar todo por los datos de ejemplo originales. Se pierde lo que hayas cargado.",
      accion: () => { setData(datosDemo()); toast("♻️ Datos de ejemplo restaurados"); },
    });
  };

  const cerrarSesion = () => {
    setAbierto(false);
    onCerrarSesion();
  };

  const opciones = [
    { id: "manual", icon: BookOpen, label: "Manual de usuario", onClick: () => { setManualAbierto(true); setAbierto(false); } },
    { id: "tema", icon: oscuro ? Sun : Moon, label: oscuro ? "Modo día" : "Modo noche", onClick: () => { setOscuro(!oscuro); setAbierto(false); } },
    { id: "descargar", icon: Receipt, label: "Descargar respaldo", onClick: descargarRespaldo },
    ...(puedeEditar ? [{ id: "restaurar", icon: RotateCcw, label: "Restaurar ejemplo", onClick: restaurarEjemplo }] : []),
    { id: "salir", icon: LogOut, label: "Cerrar sesión", onClick: cerrarSesion },
  ];

  return (
    <div className="relative">
      <ConTooltip texto="Configuración" posicion="abajo">
        <button
          onClick={() => setAbierto((a) => !a)}
          className="rounded-full p-2 text-white hover:bg-white hover:bg-opacity-10"
          title="Configuración"
        >
          <Settings size={16} />
        </button>
      </ConTooltip>
      {abierto && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setAbierto(false)} />
          <div className="fixed right-3 top-16 z-50 w-64 max-w-[90vw] overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-2xl sm:right-5 sm:top-20">
            <div className="border-b border-gray-100 px-4 py-2.5 dark:border-gray-700">
              <span className="text-sm font-bold" style={{ color: NAVY_TEXT }}>⚙️ Configuración</span>
              {usuarioActual && (
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  Conectado como <b>{usuarioActual}</b>{" "}
                  {rol === "visualizador" && <span className="ml-1 inline-flex items-center gap-0.5"><Lock size={10} /> solo lectura</span>}
                  {rol === "cajero" && <span className="ml-1 inline-flex items-center gap-0.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] dark:bg-gray-700">cajero — solo Ventas</span>}
                </p>
              )}
            </div>
            <ul className="py-1">
              {opciones.map((o) => {
                const Ic = o.icon;
                return (
                  <li key={o.id}>
                    <button onClick={o.onClick} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
                      <Ic size={15} /> {o.label}
                    </button>
                  </li>
                );
              })}
              {puedeEditar && (
                <li>
                  <label className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
                    <Upload size={15} />
                    Restaurar respaldo
                    <input type="file" accept="application/json" className="hidden" onChange={restaurarRespaldo} />
                  </label>
                </li>
              )}
            </ul>
            <p className="border-t border-gray-100 px-4 py-2 text-center text-[11px] text-gray-400 dark:border-gray-700 dark:text-gray-500">
              Versión {APP_VERSION}
            </p>
          </div>
        </>
      )}
      {manualAbierto && <ModalManual onClose={() => setManualAbierto(false)} />}
    </div>
  );
}

export default MenuConfiguracion;
