import React, { useState } from "react";
import { USUARIOS, LOGIN_STORAGE_KEY, RolContext } from "./auth/usuarios.js";
import PantallaLogin from "./auth/PantallaLogin.jsx";
import App from "./App.jsx";

function AppConLogin() {
  const [sesion, setSesion] = useState(() => {
    try {
      const guardado = JSON.parse(localStorage.getItem(LOGIN_STORAGE_KEY) || "null");
      // Verificamos que el usuario guardado siga existiendo en la lista (por si
      // se lo sacó de USUARIOS después de haber iniciado sesión alguna vez).
      if (guardado && USUARIOS.some((u) => u.usuario === guardado.usuario)) return guardado;
      return null;
    } catch (e) { return null; }
  });
  if (!sesion) return <PantallaLogin onIngresar={(u) => setSesion({ usuario: u.usuario, rol: u.rol })} />;
  return (
    <RolContext.Provider value={sesion.rol}>
      <App usuarioActual={sesion.usuario} onCerrarSesion={() => { try { localStorage.removeItem(LOGIN_STORAGE_KEY); } catch (e) {} setSesion(null); }} />
    </RolContext.Provider>
  );
}

export default AppConLogin;
