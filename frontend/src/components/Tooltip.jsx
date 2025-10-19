import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// Portal-based tooltip that positions itself relative to an anchor element.
// Props:
// - id: string (used for aria-describedby)
// - anchorEl: DOM element to anchor to
// - visible: boolean
// - children: tooltip content
const Tooltip = ({ id, anchorEl, visible, children }) => {
  const elRef = useRef(null);
  const [pos, setPos] = useState({
    left: 0,
    top: 0,
    transform: "translateX(-50%)",
  });

  useEffect(() => {
    if (!anchorEl || !visible) return;

    const update = () => {
      const rect = anchorEl.getBoundingClientRect();
      const tooltip = elRef.current;
      if (!tooltip) return;
      const ttRect = tooltip.getBoundingClientRect();
      const margin = 8;
      let top = rect.top - ttRect.height - margin + window.scrollY;
      let left = rect.left + rect.width / 2 + window.scrollX;
      let transform = "translateX(-50%)";
      // if not enough space above, place below
      if (top < window.scrollY + 8) {
        top = rect.bottom + margin + window.scrollY;
      }
      // keep tooltip within viewport horizontally
      const minLeft = ttRect.width / 2 + 8;
      const maxLeft = window.innerWidth - ttRect.width / 2 - 8;
      if (left < minLeft) left = minLeft;
      if (left > maxLeft) left = maxLeft;

      setPos({ left, top, transform });
    };

    // initial update and listeners
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [anchorEl, visible]);

  const content = (
    <div
      ref={elRef}
      id={id}
      role="tooltip"
      aria-hidden={!visible}
      style={{
        position: "absolute",
        left: pos.left,
        top: pos.top,
        transform: pos.transform,
        pointerEvents: "none",
        transition: "opacity 120ms ease",
        opacity: visible ? 1 : 0,
        zIndex: 1000,
      }}
    >
      <div className="bg-gray-800 text-white text-xs rounded px-2 py-1">
        {children}
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default Tooltip;
