/* ══════════════════════════════════════════════════════════════
   BASE DE DATOS (Supabase) — opcional
   Si SUPABASE_URL / SUPABASE_ANON_KEY quedan vacíos, la app sigue
   funcionando igual, guardando solo en el navegador (localStorage).
   ══════════════════════════════════════════════════════════════ */
const SUPABASE_URL = "https://zzowlamfxvxnkasfzxce.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6b3dsYW1meHZ4bmthc2Z6eGNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1NDgxMDAsImV4cCI6MjEwNDEyNDEwMH0.GN7u0BYSzAGc9JjbjbC75rJyyAcQmV5d6I0Rk0HuRDw";

const DB_TABLA = "datos_app";
const DB_ID = "principal";

export const dbConfigurada = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

export async function dbLeer() {
  if (!dbConfigurada) return null;
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${DB_TABLA}?id=eq.${DB_ID}&select=payload`,
    { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
  );
  if (!res.ok) throw new Error("No se pudo leer la base de datos");
  const filas = await res.json();
  return filas.length ? filas[0].payload : null;
}

export async function dbGuardar(data) {
  if (!dbConfigurada) return false;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${DB_TABLA}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({ id: DB_ID, payload: data, actualizado_en: new Date().toISOString() }),
  });
  return res.ok;
}

export const STORAGE_KEY = "gastro_costos_v1";
export const STORAGE_KEY_BACKUP = "gastro_costos_v1_backup";
