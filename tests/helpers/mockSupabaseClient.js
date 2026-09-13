import { vi } from "vitest";

// Supabase-js arma queries encadenables (.from().select().eq()...) que además
// son "thenables": se pueden awaitear en cualquier punto de la cadena, no solo
// al final. Este builder chico imita eso: cada método de la cadena devuelve el
// mismo objeto (para poder seguir encadenando) y ese objeto resuelve como
// promesa al resultado que le configuremos.
export function makeQueryResult(resultado = { data: null, error: null }) {
  const builder = {};
  const encadenable = (metodo) => vi.fn(() => builder);
  Object.assign(builder, {
    select: encadenable("select"),
    insert: encadenable("insert"),
    update: encadenable("update"),
    delete: encadenable("delete"),
    upsert: encadenable("upsert"),
    eq: encadenable("eq"),
    single: encadenable("single"),
    maybeSingle: encadenable("maybeSingle"),
    then: (resolve, reject) => Promise.resolve(resultado).then(resolve, reject),
  });
  return builder;
}

// Crea un cliente falso donde .from("tabla") devuelve el resultado que le
// hayamos configurado para esa tabla específica (por defecto, éxito vacío).
export function makeSupabaseClient(resultadosPorTabla = {}) {
  const from = vi.fn((tabla) => resultadosPorTabla[tabla] || makeQueryResult());
  const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
  return { from, rpc };
}
