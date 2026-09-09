import React from "react";
import { NAVY } from "../config/constants.js";
import { X } from "./icons.jsx";
import ConTooltip from "./ConTooltip.jsx";

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="animate-modal-overlay fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-40 p-3 sm:p-6">
      <div className={`animate-modal-panel mx-auto my-2 w-full ${wide ? "max-w-4xl" : "max-w-2xl"} rounded-lg bg-white dark:bg-gray-800 shadow-2xl`}>
        <div className="flex items-center justify-between rounded-t-lg px-5 py-3" style={{ backgroundColor: NAVY }}>
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <ConTooltip texto="Cerrar">
            <button onClick={onClose} className="rounded p-1 text-white hover:bg-white dark:bg-gray-800 hover:bg-opacity-20" aria-label="Cerrar" title="Cerrar">
              <X size={18} />
            </button>
          </ConTooltip>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}


export default Modal;
