import React from "react";

function PieConLeyenda({ data, paleta, valueFmt = (v) => v }) {
  const total = data.reduce((a, d) => a + d.value, 0) || 1;
  const size = 200, r = 90, cx = 100, cy = 100;
  let acc = 0;
  const arcos = data.map((d, i) => {
    const start = (acc / total) * 2 * Math.PI;
    acc += d.value;
    const end = (acc / total) * 2 * Math.PI;
    const large = end - start > Math.PI ? 1 : 0;
    const x1 = cx + r * Math.sin(start), y1 = cy - r * Math.cos(start);
    const x2 = cx + r * Math.sin(end), y2 = cy - r * Math.cos(end);
    const path = data.length === 1
      ? `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy}`
      : `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
    return { path, color: paleta[i % paleta.length] };
  });
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      <svg viewBox={`0 0 ${size} ${size}`} width={220} height={220} className="shrink-0">
        {arcos.map((a, i) => <path key={i} d={a.path} fill={a.color} stroke="white" strokeWidth="2" />)}
      </svg>
      <ul className="w-full space-y-1.5 text-xs">
        {data.map((d, i) => (
          <li key={i} className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: paleta[i % paleta.length] }} />
              <span className="truncate text-gray-700 dark:text-gray-300">{d.name}</span>
            </span>
            <span className="shrink-0 font-medium text-gray-600 dark:text-gray-400">
              {valueFmt(d.value)} · {((d.value / total) * 100).toFixed(0)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}


export default PieConLeyenda;
