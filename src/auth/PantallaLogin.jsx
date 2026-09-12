import React, { useState } from "react";
import { NAVY, NAVY_TEXT, ROJO, ROJO_BG, inputCls } from "../config/constants.js";
import { Eye, EyeOff } from "../components/icons.jsx";
import Campo from "../components/Campo.jsx";
import { iniciarSesion } from "../services/supabase.js";

function PantallaLogin({ onIngresar }) {
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mostrarClave, setMostrarClave] = useState(false);

  // Ojo: evitamos depender de <form onSubmit> / botón type="submit". En algunos
  // entornos con sandbox restrictivo (como el preview de artefactos de Claude),
  // el envío nativo de formularios puede estar bloqueado sin tirar ningún error
  // visible — el click simplemente no hace nada. Por eso todo se maneja con
  // onClick directo, y "Enter" se captura a mano en cada input.
  const intentar = async () => {
    if (!email.trim() || !clave || cargando) return;
    setCargando(true);
    setError("");
    try {
      const session = await iniciarSesion(email.trim(), clave);
      onIngresar(session);
    } catch (e) {
      setError("Usuario o contraseña incorrectos");
    } finally {
      setCargando(false);
    }
  };
  const alPresionarEnter = (e) => { if (e.key === "Enter") intentar(); };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-100 via-gray-100 to-blue-50 px-4 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <div className="w-full max-w-sm overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl">
        <div className="h-1.5" style={{ backgroundColor: NAVY }} />
        <div className="p-7">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: NAVY_TEXT }}>La Nuna</h1>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Gestión gastronómica</p>
            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">Ingresá con tu cuenta para continuar</p>
          </div>
        <div className="space-y-3">
          <Campo label="Email">
            <input autoFocus type="email" className={inputCls} value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              onKeyDown={alPresionarEnter} />
          </Campo>
          <Campo label="Contraseña">
            <div className="relative">
              <input type={mostrarClave ? "text" : "password"} className={inputCls + " pr-10"} value={clave}
                onChange={(e) => { setClave(e.target.value); setError(""); }}
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
            {error}
          </p>
        )}
        <button type="button" onClick={intentar} disabled={cargando} className="mt-4 w-full rounded py-2 text-sm font-semibold text-white disabled:opacity-60" style={{ backgroundColor: NAVY }}>
          {cargando ? "Ingresando…" : "Ingresar"}
        </button>
        </div>
      </div>
    </div>
  );
}

export default PantallaLogin;

