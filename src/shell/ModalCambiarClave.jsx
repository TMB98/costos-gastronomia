import React, { useState } from "react";
import { NAVY_TEXT, ROJO, ROJO_BG, VERDE, VERDE_BG, inputCls } from "../config/constants.js";
import { Lock, Eye, EyeOff } from "../components/icons.jsx";
import Modal from "../components/Modal.jsx";
import Campo from "../components/Campo.jsx";
import Boton from "../components/Boton.jsx";
import { cambiarPropiaClave } from "../services/supabase.js";

function ModalCambiarClave({ onClose }) {
  const [nueva, setNueva] = useState("");
  const [repetir, setRepetir] = useState("");
  const [mostrar, setMostrar] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    setError("");
    if (nueva.length < 6) { setError("La contraseña tiene que tener al menos 6 caracteres."); return; }
    if (nueva !== repetir) { setError("Las dos contraseñas no coinciden."); return; }
    setGuardando(true);
    try {
      await cambiarPropiaClave(nueva);
      setExito(true);
    } catch (e) {
      setError("No se pudo cambiar la contraseña. Probá de nuevo en un momento.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal title="Cambiar mi contraseña" onClose={onClose}>
      {exito ? (
        <div className="rounded-lg p-4 text-center text-sm font-medium" style={{ backgroundColor: VERDE_BG, color: VERDE }}>
          ✅ Contraseña actualizada. La vas a usar la próxima vez que inicies sesión.
        </div>
      ) : (
        <>
          <p className="mb-4 flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Lock size={15} className="mt-0.5 shrink-0" />
            Elegí una contraseña nueva para tu cuenta. No hace falta que ingreses la actual.
          </p>
          <div className="space-y-3">
            <Campo label="Contraseña nueva">
              <div className="relative">
                <input
                  type={mostrar ? "text" : "password"}
                  className={inputCls + " pr-10"}
                  value={nueva}
                  onChange={(e) => { setNueva(e.target.value); setError(""); }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setMostrar((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                  title={mostrar ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {mostrar ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Campo>
            <Campo label="Repetir contraseña nueva">
              <input
                type={mostrar ? "text" : "password"}
                className={inputCls}
                value={repetir}
                onChange={(e) => { setRepetir(e.target.value); setError(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") guardar(); }}
              />
            </Campo>
          </div>
          {error && (
            <p className="mt-3 rounded px-3 py-2 text-center text-xs font-medium" style={{ backgroundColor: ROJO_BG, color: ROJO }}>
              {error}
            </p>
          )}
          <div className="mt-5 flex justify-end gap-2">
            <Boton variant="ghost" onClick={onClose}>Cancelar</Boton>
            <Boton onClick={guardar} disabled={guardando}>{guardando ? "Guardando…" : "Guardar contraseña nueva"}</Boton>
          </div>
        </>
      )}
    </Modal>
  );
}

export default ModalCambiarClave;
