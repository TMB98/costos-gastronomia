import React from "react";
import { NAVY_TEXT } from "../config/constants.js";

function Tarjeta({ titulo, subtitulo, children, extra }) {
  return (
    <section className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
      {(titulo || extra) && (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 dark:border-gray-700 px-5 py-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: NAVY_TEXT }}>{titulo}</h2>
            {subtitulo && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{subtitulo}</p>}
          </div>
          {extra}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}


export default Tarjeta;
