import { createClient } from "@supabase/supabase-js";

/* ══════════════════════════════════════════════════════════════
   BASE DE DATOS + AUTENTICACIÓN (Supabase)
   Las credenciales vienen de variables de entorno (.env) — nunca
   hardcodeadas en el código. Ver .env.example para la plantilla.
   ══════════════════════════════════════════════════════════════ */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

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

// Cambia la contraseña del usuario actualmente logueado. Supabase ya exige
// estar autenticado para esto — no hace falta reingresar la contraseña vieja.
export async function cambiarPropiaClave(nuevaClave) {
  const { error } = await supabase.auth.updateUser({ password: nuevaClave });
  if (error) throw error;
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

