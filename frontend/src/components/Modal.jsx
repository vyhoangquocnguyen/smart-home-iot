import React, { useEffect, useState } from "react";

const Modal = ({ open, onClose, title, children }) => {
  const [visible, setVisible] = useState(open);

  useEffect(() => {
    if (open) setVisible(true);
    else if (!open) {
      // play exit animation then hide
      setVisible(false);
    }
  }, [open]);

  // If not open and not visible, don't render
  if (!open && !visible) return null;

  // When user requests close, call onClose after animation
  const handleClose = () => {
    // trigger exit by toggling a local class — parent should set open=false to finalize
    if (typeof onClose === "function") onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity ${
          open ? "opacity-95" : "opacity-0"
        }`}
        onClick={handleClose}
      />
      <div
        className={`bg-white rounded-lg shadow-lg max-w-4xl w-full mx-4 transform transition-all duration-200 ${
          open
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-2 scale-95 opacity-0"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            className="text-gray-600 hover:text-gray-800"
            onClick={handleClose}
          >
            ✕
          </button>
        </div>
        <div className="p-4 max-h-[70vh] overflow-auto">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
