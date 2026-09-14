import * as Sentry from "@sentry/react";
import { APP_VERSION } from "../config/constants.js";

/* ══════════════════════════════════════════════════════════════
   MONITOREO DE ERRORES (Sentry)
   Igual que con Supabase: si no hay DSN configurado (VITE_SENTRY_DSN),
   todo esto se convierte en un no-op silencioso — la app funciona
   exactamente igual, simplemente sin reportar nada a ningún lado.
   Así el proyecto de desarrollo (o cualquiera que clone el repo sin
   configurar Sentry) no rompe ni tira warnings raros.
   ══════════════════════════════════════════════════════════════ */

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

export const monitoreoConfigurado = !!SENTRY_DSN;

export function iniciarMonitoreo() {
  if (!monitoreoConfigurado) return;
  Sentry.init({
    dsn: SENTRY_DSN,
    // Sube la app "compilada" (con nombre y versión) para que los errores
    // en Sentry se puedan filtrar por versión — coincide con APP_VERSION.
    release: `costos-gastronomia@${APP_VERSION}`,
    // Volumen bajo (un solo local, pocos usuarios a la vez): no hace falta
    // mandar el 100% del tracing de performance, solo errores.
    tracesSampleRate: 0,
  });
}

// Reporta un error a Sentry con contexto de qué se estaba haciendo cuando
// pasó — sin esto, un error solo se ve como el toast que desaparece.
// `contexto` es un objeto chico, ej: { accion: "guardarIng", ingredienteId }.
export function reportarError(error, contexto = {}) {
  if (!monitoreoConfigurado) return;
  Sentry.captureException(error, { extra: contexto });
}

// Para atrapar errores de render de React que romperían toda la pantalla
// (no solo los que ya están en un try/catch de una acción puntual).
export const LimiteDeErrores = Sentry.ErrorBoundary;
