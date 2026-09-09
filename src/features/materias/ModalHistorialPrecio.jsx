import React, { useMemo } from "react";
import { NAVY, VERDE_BG, VERDE_TEXT, AMARILLO_BG, AMARILLO_TEXT } from "../../config/constants.js";
import { hoyISO, $, fechaCorta } from "../../lib/formato.js";
import Modal from "../../components/Modal.jsx";

function ModalHistorialPrecio({ ingrediente, onClose }) {
  // Combinamos el historial guardado con el precio actual para armar la línea de
  // tiempo completa. El precio actual siempre es el punto más reciente.
  const puntos = useMemo(() => {
    const previos = (ingrediente.historial || []).map((h) => ({ fecha: h.fecha, precio: Number(h.precio) }));
    const actual = ingrediente.precio != null
      ? [{ fecha: ingrediente.fechaPrecio || hoyISO(), precio: Number(ingrediente.precio) }]
      : [];
    const todos = [...previos, ...actual]
      .filter((p) => p.precio != null && !Number.isNaN(p.precio))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
    // Si dos puntos caen en la misma fecha (por ejemplo, se editó dos veces el
    // mismo día), nos quedamos con el último — no tiene sentido duplicar la fila.
    const porFecha = {};
    todos.forEach((p) => (porFecha[p.fecha] = p.precio));
    return Object.entries(porFecha).map(([fecha, precio]) => ({ fecha, precio })).sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [ingrediente]);

  const hayHistorial = puntos.length >= 2;
  const primero = puntos[0];
  const ultimo = puntos[puntos.length - 1];
  const variacionTotal = hayHistorial && primero.precio > 0 ? ((ultimo.precio - primero.precio) / primero.precio) * 100 : null;

  return (
    <Modal title={`Historial de precio — ${ingrediente.nombre}`} onClose={onClose}>
      {!hayHistorial ? (
        <p className="rounded border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
          Todavía no hay suficiente historial para este ingrediente. Se va armando solo, a medida que actualices el precio con el tiempo — la próxima vez que lo cambies, va a quedar registrado acá.
        </p>
      ) : (
        <>
          <div
            className="mb-4 rounded-lg p-4 text-center"
            style={{ backgroundColor: variacionTotal >= 0 ? AMARILLO_BG : VERDE_BG }}
          >
            <p className="text-2xl font-bold" style={{ color: variacionTotal >= 0 ? AMARILLO_TEXT : VERDE_TEXT }}>
              {variacionTotal >= 0 ? "▲" : "▼"} {Math.abs(variacionTotal).toFixed(0)}%
            </p>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              {variacionTotal >= 0 ? "Subió" : "Bajó"} desde el {fechaCorta(primero.fecha)} ({$(primero.precio)} → {$(ultimo.precio)})
            </p>
          </div>

          <div className="overflow-x-auto rounded border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead style={{ backgroundColor: NAVY }}>
                <tr className="text-left text-xs uppercase tracking-wide text-white">
                  <th className="px-3 py-2">Fecha</th>
                  <th className="px-3 py-2 text-right">Precio</th>
                  <th className="px-3 py-2 text-right">Variación</th>
                </tr>
              </thead>
              <tbody>
                {puntos.map((p, i) => {
                  const anterior = i > 0 ? puntos[i - 1].precio : null;
                  const variacion = anterior && anterior > 0 ? ((p.precio - anterior) / anterior) * 100 : null;
                  return (
                    <tr key={p.fecha} className={i % 2 ? "bg-gray-50 dark:bg-gray-700/40" : "bg-white dark:bg-gray-800"}>
                      <td className="px-3 py-2">{fechaCorta(p.fecha)}</td>
                      <td className="px-3 py-2 text-right font-medium">{$(p.precio)}</td>
                      <td className="px-3 py-2 text-right">
                        {variacion == null ? (
                          <span className="text-gray-400 dark:text-gray-500">—</span>
                        ) : (
                          <span style={{ color: variacion >= 0 ? AMARILLO_TEXT : VERDE_TEXT }}>
                            {variacion >= 0 ? "▲" : "▼"} {Math.abs(variacion).toFixed(0)}%
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Modal>
  );
}

export default ModalHistorialPrecio;
