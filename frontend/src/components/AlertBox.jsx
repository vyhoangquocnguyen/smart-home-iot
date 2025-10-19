import { useState } from "react";

const AlertItem = ({ a, onDismiss }) => (
  <div className="flex items-start justify-between bg-red-50 border border-red-100 p-2 rounded mb-2">
    <div className="text-red-700">
      <strong>{a.deviceId}</strong>: Temp {a.temperature}°C | Humidity{" "}
      {a.humidity}%
      <div className="text-xs text-red-500">
        {new Date(a.ts).toLocaleTimeString()}
      </div>
    </div>
    <button
      onClick={() => onDismiss(a.id)}
      className="text-sm text-red-600 hover:underline ml-4"
    >
      Dismiss
    </button>
  </div>
);

const AlertBox = ({ alerts, onDismiss, onClear }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed right-4 bottom-4 z-50">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-red-600 text-white px-3 py-2 rounded shadow-lg"
          title="Open alerts"
        >
          Alerts
          <span className="bg-white text-red-600 rounded-full w-6 h-6 flex items-center justify-center text-sm">
            {alerts.length}
          </span>
        </button>
      ) : (
        <div className="w-80 bg-white border border-gray-200 shadow-xl rounded p-3 transform transition-transform duration-200 ease-out scale-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-red-600">Alerts</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={onClear}
                className="text-xs text-gray-600 hover:underline"
              >
                Clear
              </button>
              <button
                onClick={() => setOpen(false)}
                className="text-xs text-gray-600 hover:underline"
              >
                Minimize
              </button>
            </div>
          </div>

          <div className="max-h-60 overflow-auto">
            {alerts.length === 0 && (
              <div className="text-sm text-gray-500">No alerts</div>
            )}
            {alerts.map((a) => (
              <AlertItem key={a.id} a={a} onDismiss={onDismiss} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertBox;
