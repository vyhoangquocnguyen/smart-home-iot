import { useEffect } from "react";

const Toast = ({ message, visible, onClose }) => {
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(onClose, 2500);
    return () => clearTimeout(t);
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-4 py-2 rounded shadow-lg z-50">
      {message}
    </div>
  );
};

export default Toast;
