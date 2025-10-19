import Charts from "./Charts";
import Notification from "./Notification";
import Modal from "./Modal";
import { useState } from "react";
import { IconChart } from "./Icons";

const ago = (ts) => {
  if (!ts) return "-";
  const diff = Date.now() - new Date(ts).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
};

const SensorCard = ({ deviceId, data }) => {
  const latest = data && data.length > 0 ? data[0] : null;
  const temperature = latest?.temperature ?? null;
  const humidity = latest?.humidity ?? null;
  const timestamp = latest?.timestamp ?? null;

  const isAlert =
    (temperature !== null && Number(temperature) > 30) ||
    (humidity !== null && Number(humidity) > 70);

  const ageMs = latest
    ? Date.now() - new Date(latest.timestamp).getTime()
    : Infinity;
  const isStale = ageMs > 2 * 60 * 1000; // 2 minutes

  const [open, setOpen] = useState(false);

  return (
    <div
      className={`bg-white/90 shadow-sm rounded-xl p-4 m-2 transition-shadow duration-300 ${
        isAlert ? "ring-2 ring-red-300" : isStale ? "opacity-80" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            🔎 Sensor: {deviceId}
          </h2>
          <div className="flex gap-2 items-center mt-2">
            {isStale && (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                STALE
              </span>
            )}
            {isAlert && (
              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                ALERT
              </span>
            )}
          </div>
        </div>

        <div className="text-right">
          <div className="text-2xl font-bold">{temperature ?? "-"}°C</div>
          <div className="text-sm text-gray-500">{humidity ?? "-"}%</div>
        </div>
      </div>

      <p className="text-sm text-gray-500 mt-2">
        Updated {timestamp ? ago(timestamp) : "-"}
      </p>

      <div className="mt-3 flex items-center justify-between">
        <Notification temperature={temperature} humidity={humidity} />
        <button
          className="text-sm px-3 py-1 bg-blue-600 text-white rounded inline-flex items-center gap-2"
          onClick={() => setOpen(true)}
        >
          <IconChart className="w-4 h-4" /> View chart
        </button>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`History: ${deviceId}`}
      >
        <Charts data={(data || []).slice(0, 200)} />
      </Modal>
    </div>
  );
};

export default SensorCard;
