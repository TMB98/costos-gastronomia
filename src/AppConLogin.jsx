import React, { useState, useEffect } from "react";
import { RolContext } from "./auth/usuarios.js";
import PantallaLogin from "./auth/PantallaLogin.jsx";
import App from "./App.jsx";
import { dbConfigurada, obtenerSesion, obtenerPerfil, cerrarSesion, alCambiarSesion } from "./services/supabase.js";

function AppConLogin() {
  // "cargando": todavía no sabemos si hay sesión o no (evita el parpadeo de
  // login → app al recargar la página con una sesión válida existente).
  const [estado, setEstado] = useState({ cargando: true, sesion: null, perfil: null, error: null });

  const cargarPerfilDeSesion = async (session) => {
    if (!session) { setEstado({ cargando: false, sesion: null, perfil: null, error: null }); return; }
    try {
      const perfil = await obtenerPerfil(session.user.id);
      setEstado({ cargando: false, sesion: session, perfil, error: null });
    } catch (e) {
      // Sesión válida pero sin fila en "perfiles" — no le asignamos ningún rol
      // por las dudas (RolContext no llega a proveerse), la dejamos afuera con
      // un mensaje claro en vez de dejarla entrar con permisos por defecto.
      setEstado({ cargando: false, sesion: session, perfil: null, error: "sin-perfil" });
    }
  };

  useEffect(() => {
    if (!dbConfigurada) { setEstado({ cargando: false, sesion: null, perfil: null, error: null }); return; }
    obtenerSesion().then(cargarPerfilDeSesion);
    const desuscribir = alCambiarSesion((session) => {
      if (!session) setEstado({ cargando: false, sesion: null, perfil: null, error: null });
      else cargarPerfilDeSesion(session);
    });
    return desuscribir;
  }, []);

  if (estado.cargando) {
    return <div className="flex h-screen items-center justify-center text-sm text-gray-500 dark:text-gray-400">Cargando…</div>;
  }

  if (!estado.sesion) {
    return <PantallaLogin onIngresar={(session) => cargarPerfilDeSesion(session)} />;
  }

  if (estado.error === "sin-perfil") {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Tu cuenta existe pero todavía no tiene un rol asignado. Pedile a un admin que te lo configure.
        </p>
        <button onClick={() => cerrarSesion()} className="text-sm font-medium text-blue-600 underline">Volver al login</button>
      </div>
    );
  }

  return (
    <RolContext.Provider value={estado.perfil.rol}>
      <App usuarioActual={estado.perfil.nombre || estado.sesion.user.email} onCerrarSesion={cerrarSesion} />
    </RolContext.Provider>
  );
}

export default AppConLogin;

