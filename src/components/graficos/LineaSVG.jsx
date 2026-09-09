import React from "react";

function LineaSVG({ data, valueKey, labelKey, color = "#1B3A6B", height = 220, valueFmt = (v) => v }) {
  const width = 640;
  const padL = 46, padR = 16, padT = 16, padB = 30;
  const w = width - padL - padR, h = height - padT - padB;
  const valores = data.map((d) => d[valueKey]);
  const max = Math.max(...valores), min = Math.min(...valores);
  const rango = max - min || 1;
  const pts = data.map((d, i) => ({
    x: padL + (data.length > 1 ? (i / (data.length - 1)) * w : w / 2),
    y: padT + h - ((d[valueKey] - min) / rango) * h,
    ...d,
  }));
  const poly = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const yTicks = [0, 0.5, 1].map((f) => min + f * rango);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="xMidYMid meet">
      {yTicks.map((v, i) => {
        const y = padT + h - ((v - min) / rango) * h;
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={width - padR} y2={y} stroke="#e2e8f0" strokeWidth="1" />
            <text x={padL - 8} y={y + 3} fontSize="10" textAnchor="end" fill="#94a3b8">{valueFmt(v)}</text>
          </g>
        );
      })}
      <polyline points={poly} fill="none" stroke={color} strokeWidth="2.5" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3.5" fill={color} />
          <text x={p.x} y={height - 8} fontSize="10" textAnchor="middle" fill="#64748b">{p[labelKey]}</text>
        </g>
      ))}
    </svg>
  );
}

export default LineaSVG;
