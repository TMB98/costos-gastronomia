import React, { useState } from "react";
import { NAVY, NAVY_TEXT, ROJO, ROJO_BG, inputCls } from "../config/constants.js";
import { Eye, EyeOff } from "../components/icons.jsx";
import Campo from "../components/Campo.jsx";
import { USUARIOS, LOGIN_STORAGE_KEY } from "./usuarios.js";

function PantallaLogin({ onIngresar }) {
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState(false);
  const [mostrarClave, setMostrarClave] = useState(false);

  // Ojo: evitamos depender de <form onSubmit> / botón type="submit". En algunos
  // entornos con sandbox restrictivo (como el preview de artefactos de Claude),
  // el envío nativo de formularios puede estar bloqueado sin tirar ningún error
  // visible — el click simplemente no hace nada. Por eso todo se maneja con
  // onClick directo, y "Enter" se captura a mano en cada input.
  const intentar = () => {
    const encontrado = USUARIOS.find(
      (u) => u.usuario.toLowerCase() === usuario.trim().toLowerCase() && u.clave === clave
    );
    if (encontrado) {
      try { localStorage.setItem(LOGIN_STORAGE_KEY, JSON.stringify({ usuario: encontrado.usuario, rol: encontrado.rol })); } catch (err) {}
      setError(false);
      onIngresar(encontrado);
    } else {
      setError(true);
    }
  };
  const alPresionarEnter = (e) => { if (e.key === "Enter") intentar(); };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-lg">
        <div className="mb-5 text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full text-2xl" style={{ backgroundColor: NAVY }}>
            🔒
          </div>
          <h1 className="text-lg font-bold" style={{ color: NAVY_TEXT }}>Control de costos gastronómico</h1>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Ingresá usuario y contraseña para continuar</p>
        </div>
        <div className="space-y-3">
          <Campo label="Usuario">
            <input autoFocus className={inputCls} value={usuario}
              onChange={(e) => { setUsuario(e.target.value); setError(false); }}
              onKeyDown={alPresionarEnter} />
          </Campo>
          <Campo label="Contraseña">
            <div className="relative">
              <input type={mostrarClave ? "text" : "password"} className={inputCls + " pr-10"} value={clave}
                onChange={(e) => { setClave(e.target.value); setError(false); }}
                onKeyDown={alPresionarEnter} />
              <button
                type="button"
                onClick={() => setMostrarClave((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                title={mostrarClave ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {mostrarClave ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Campo>
        </div>
        {error && (
          <p className="mt-3 rounded px-3 py-2 text-center text-xs font-medium" style={{ backgroundColor: ROJO_BG, color: ROJO }}>
            Usuario o contraseña incorrectos
          </p>
        )}
        <button type="button" onClick={intentar} className="mt-4 w-full rounded py-2 text-sm font-semibold text-white" style={{ backgroundColor: NAVY }}>
          Ingresar
        </button>
      </div>
    </div>
  );
}

export default PantallaLogin;
