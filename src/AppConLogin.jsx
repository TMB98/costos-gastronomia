import React, { useState, useEffect } from "react";
import { RolContext } from "./auth/usuarios.js";
import PantallaLogin from "./auth/PantallaLogin.jsx";
import App from "./App.jsx";
import { dbConfigurada, obtenerSesion, cerrarSesion, alCambiarSesion } from "./services/supabase.js";
import { obtenerMembership } from "./services/datos.js";

function AppConLogin() {
  // "cargando": todavía no sabemos si hay sesión o no (evita el parpadeo de
  // login → app al recargar la página con una sesión válida existente).
  const [estado, setEstado] = useState({ cargando: true, sesion: null, membership: null, error: null });

  const cargarMembershipDeSesion = async (session) => {
    if (!session) { setEstado({ cargando: false, sesion: null, membership: null, error: null }); return; }
    try {
      const membership = await obtenerMembership(session.user.id);
      setEstado({ cargando: false, sesion: session, membership, error: null });
    } catch (e) {
      // Sesión válida pero sin membresía en ninguna empresa — no le asignamos
      // ningún rol por las dudas (RolContext no llega a proveerse), la dejamos
      // afuera con un mensaje claro en vez de dejarla entrar con permisos por defecto.
      setEstado({ cargando: false, sesion: session, membership: null, error: "sin-membership" });
    }
  };

  useEffect(() => {
    if (!dbConfigurada) { setEstado({ cargando: false, sesion: null, membership: null, error: null }); return; }
    obtenerSesion().then(cargarMembershipDeSesion);
    const desuscribir = alCambiarSesion((session) => {
      if (!session) setEstado({ cargando: false, sesion: null, membership: null, error: null });
      else cargarMembershipDeSesion(session);
    });
    return desuscribir;
  }, []);

  if (estado.cargando) {
    return <div className="flex h-screen items-center justify-center text-sm text-gray-500 dark:text-gray-400">Cargando…</div>;
  }

  if (!estado.sesion) {
    return <PantallaLogin onIngresar={(session) => cargarMembershipDeSesion(session)} />;
  }

  if (estado.error === "sin-membership") {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Tu cuenta existe pero todavía no tiene acceso a ninguna empresa. Pedile a un admin que te lo configure.
        </p>
        <button onClick={() => cerrarSesion()} className="text-sm font-medium text-blue-600 underline">Volver al login</button>
      </div>
    );
  }

  return (
    <RolContext.Provider value={estado.membership.rol}>
      <App
        usuarioActual={estado.membership.nombre || estado.sesion.user.email}
        usuarioId={estado.sesion.user.id}
        companyId={estado.membership.companyId}
        onCerrarSesion={cerrarSesion}
      />
    </RolContext.Provider>
  );
}

export default AppConLogin;

