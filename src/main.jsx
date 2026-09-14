import React from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";
import AppConLogin from "./AppConLogin.jsx";
import { iniciarMonitoreo, reportarError, LimiteDeErrores } from "./services/monitoreo.js";

iniciarMonitoreo();

// Si React se rompe al renderizar (un error que ningún try/catch de la app
// llega a atajar), esto evita la pantalla en blanco: se reporta a Sentry y
// se le ofrece a la persona recargar, en vez de quedar con una app muerta
// sin ningún mensaje.
function PantallaDeError() {
  return (
    <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 420, textAlign: "center" }}>
        <p style={{ fontSize: 15, color: "#374151", marginBottom: 16 }}>
          Algo salió mal y la aplicación no pudo mostrarse. Ya quedó registrado el problema.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{ padding: "8px 16px", borderRadius: 6, background: "#1e293b", color: "white", border: "none", fontSize: 14, cursor: "pointer" }}
        >
          Recargar la página
        </button>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <LimiteDeErrores fallback={<PantallaDeError />} onError={(error) => reportarError(error, { accion: "render-crash" })}>
    <AppConLogin />
  </LimiteDeErrores>
);
