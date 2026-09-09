import React from "react";

function Chip({ children, color, bg }) {
  return (
    <span className="inline-block rounded-full px-2 py-0.5 text-xs font-semibold" style={{ color, backgroundColor: bg }}>
      {children}
    </span>
  );
}


export default Chip;
