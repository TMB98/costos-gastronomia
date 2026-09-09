import React from "react";

function BarraH({ data, valueFmt = (v) => v, colorFn }) {
  const max = Math.max(1, ...data.map((d) => Math.abs(d.value)));
  return (
    <div className="space-y-2.5">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <div className="w-32 shrink-0 truncate text-gray-600 dark:text-gray-400" title={d.name}>{d.name}</div>
          <div className="h-5 flex-1 overflow-hidden rounded bg-gray-100 dark:bg-gray-900">
            <div
              className="h-5 rounded transition-all"
              style={{ width: `${Math.max(2, (Math.abs(d.value) / max) * 100)}%`, backgroundColor: colorFn ? colorFn(d, i) : "#1B3A6B" }}
            />
          </div>
          <div className="w-24 shrink-0 text-right font-medium text-gray-700 dark:text-gray-300">{valueFmt(d.value)}</div>
        </div>
      ))}
      {data.length === 0 && <p className="text-center text-sm text-gray-400">Sin datos para graficar todavía.</p>}
    </div>
  );
}


export default BarraH;
