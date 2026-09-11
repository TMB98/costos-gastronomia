import { createClient } from "@supabase/supabase-js";

/* ══════════════════════════════════════════════════════════════
   BASE DE DATOS + AUTENTICACIÓN (Supabase)
   Las credenciales vienen de variables de entorno (.env) — nunca
   hardcodeadas en el código. Ver .env.example para la plantilla.
   ══════════════════════════════════════════════════════════════ */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const DB_TABLA = "datos_app";
const DB_ID = "principal";

export const dbConfigurada = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase = dbConfigurada ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

/* ---------- Autenticación ---------- */
export async function iniciarSesion(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}

export async function cerrarSesion() {
  await supabase.auth.signOut();
}

export async function obtenerSesion() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function alCambiarSesion(callback) {
  const { data } = supabase.auth.onAuthStateChange((_evento, session) => callback(session));
  return () => data.subscription.unsubscribe();
}

// El rol de cada usuario vive en la tabla "perfiles" (no en el navegador) —
// se carga una vez que sabemos quién es (auth.uid()), consultando su propia fila.
export async function obtenerPerfil(userId) {
  const { data, error } = await supabase.from("perfiles").select("rol, nombre").eq("id", userId).single();
  if (error) throw error;
  return data;
}

/* ---------- Datos de la app ---------- */
export async function dbLeer() {
  if (!dbConfigurada) return null;
  const { data, error } = await supabase.from(DB_TABLA).select("payload").eq("id", DB_ID).maybeSingle();
  if (error) throw error;
  return data ? data.payload : null;
}

export async function dbGuardar(data) {
  if (!dbConfigurada) return false;
  const { error } = await supabase
    .from(DB_TABLA)
    .upsert({ id: DB_ID, payload: data, actualizado_en: new Date().toISOString() });
  return !error;
}

export const STORAGE_KEY = "gastro_costos_v1";
export const STORAGE_KEY_BACKUP = "gastro_costos_v1_backup";

