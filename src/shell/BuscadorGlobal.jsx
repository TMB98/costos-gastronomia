import React, { useState, useRef, useEffect } from "react";
import { $ } from "../lib/formato.js";
import { Search, UtensilsCrossed, Beef } from "../components/icons.jsx";

function BuscadorGlobal({ abierto, setAbierto, data, platosCalc, setTab, setModal }) {
  const [q, setQ] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (abierto && inputRef.current) inputRef.current.focus();
    if (!abierto) setQ("");
  }, [abierto]);

  if (!abierto) return null;

  const texto = q.trim().toLowerCase();
  const ingredientes = texto
    ? data.ingredientes.filter((i) => i.nombre.toLowerCase().includes(texto)).slice(0, 6)
    : [];
  const platos = texto
    ? platosCalc.filter((p) => p.nombre.toLowerCase().includes(texto)).slice(0, 6)
    : [];
  const sinResultados = texto && ingredientes.length === 0 && platos.length === 0;

  const irAIngrediente = (ing) => {
    setTab("materias");
    setModal({ tipo: "ing", item: ing });
    setAbierto(false);
  };
  const irAPlato = (p) => {
    setTab("platos");
    setModal({ tipo: "plato", item: p });
    setAbierto(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black bg-opacity-40 px-4 pt-20 sm:pt-28" onClick={() => setAbierto(false)}>
      <div
        className="animate-modal-panel w-full max-w-lg overflow-hidden rounded-lg bg-white shadow-2xl dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <Search size={16} className="text-gray-400" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Escape") setAbierto(false); }}
            placeholder="Buscar un plato o un ingrediente…"
            className="w-full bg-transparent text-sm text-gray-900 outline-none dark:text-gray-100"
          />
          <kbd className="hidden shrink-0 rounded border border-gray-300 px-1.5 py-0.5 text-[10px] text-gray-400 dark:border-gray-600 sm:inline">
            Esc
          </kbd>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {!texto && (
            <p className="px-4 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
              Empezá a escribir para buscar en toda la app.
            </p>
          )}
          {sinResultados && (
            <p className="px-4 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
              No encontré nada con "{q}".
            </p>
          )}
          {platos.length > 0 && (
            <div>
              <p className="px-4 pt-3 text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500">Platos</p>
              {platos.map((p) => (
                <button
                  key={p.id}
                  onClick={() => irAPlato(p)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <UtensilsCrossed size={15} className="shrink-0 text-gray-400" />
                  <span className="flex-1 truncate">{p.nombre}</span>
                  <span className="shrink-0 text-xs text-gray-400">{$(p.precioVenta)}</span>
                </button>
              ))}
            </div>
          )}
          {ingredientes.length > 0 && (
            <div>
              <p className="px-4 pt-3 text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500">Materias primas</p>
              {ingredientes.map((i) => (
                <button
                  key={i.id}
                  onClick={() => irAIngrediente(i)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <Beef size={15} className="shrink-0 text-gray-400" />
                  <span className="flex-1 truncate">{i.nombre}</span>
                  <span className="shrink-0 text-xs text-gray-400">{i.precio == null ? "sin precio" : $(i.precio)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BuscadorGlobal;
