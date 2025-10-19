import { useEffect, useState, useRef } from "react";
import { fetchDevices, sendDeviceCommand } from "../services/api";
import { io } from "socket.io-client";
import Toast from "./Toast";
import Tooltip from "./Tooltip";
import { IconLight, IconFan, IconDoor } from "./Icons";

const socket = io("http://localhost:5000");

const DeviceControls = () => {
  const [devices, setDevices] = useState([]);
  const devicesRef = useRef([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: "" });
  const [tooltipId, setTooltipId] = useState(null);
  const anchorRefs = useRef({});

  // initial load + realtime updates
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchDevices()
      .then((list) => {
        if (!mounted) return;
        devicesRef.current = list || [];
        setDevices(list || []);
      })
      .catch((err) => {
        console.error("fetchDevices failed", err);
      })
      .finally(() => setLoading(false));

    const onDeviceState = (d) => {
      // keep a local ref for voice parsing and optimistic updates
      devicesRef.current = (() => {
        const updated = [...devicesRef.current];
        const idx = updated.findIndex((x) => x.deviceId === d.deviceId);
        if (idx >= 0) {
          updated[idx] = { ...updated[idx], ...d };
        } else {
          updated.unshift({
            deviceId: d.deviceId,
            type: d.type,
            state: d.state,
            lastUpdated: d.ts,
          });
        }
        return updated;
      })();
      setDevices(devicesRef.current);
    };

    socket.on("deviceState", onDeviceState);
    return () => {
      mounted = false;
      socket.off("deviceState", onDeviceState);
    };
  }, []);

  // toggle helper (optimistic)
  const toggle = async (dev) => {
    const newState = dev.state === "ON" ? "OFF" : "ON";
    devicesRef.current = devicesRef.current.map((d) =>
      d.deviceId === dev.deviceId ? { ...d, state: newState } : d
    );
    setDevices([...devicesRef.current]);
    try {
      await sendDeviceCommand({
        type: dev.type,
        deviceId: dev.deviceId,
        state: newState,
      });
      setToast({ visible: true, message: `${dev.deviceId} ${newState}` });
    } catch (err) {
      console.error("Device command failed", err);
      // revert
      devicesRef.current = devicesRef.current.map((d) =>
        d.deviceId === dev.deviceId ? { ...d, state: dev.state } : d
      );
      setDevices([...devicesRef.current]);
      setToast({ visible: true, message: `Failed to set ${dev.deviceId}` });
    }
  };

  // Note: voice feature paused — component always renders and shows a placeholder when
  // there are no devices. This avoids returning null and makes UI visible for debugging.

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6 overflow-visible">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold mb-1">Device Controls</h3>
          <div className="text-sm text-gray-500">
            Control lights, fans and doors in your home
          </div>
        </div>
        <div>
          <small className="text-sm text-gray-500">(voice paused)</small>
        </div>
      </div>

      {loading ? (
        <div className="py-6 text-center text-gray-500">Loading devices...</div>
      ) : devices.length === 0 ? (
        <div className="py-6 text-center text-gray-600">
          <div className="mb-2">No devices found.</div>
          <div className="text-sm text-gray-500">
            Try seeding devices or connect a device to the MQTT broker.
          </div>
        </div>
      ) : (
        <div
          style={{ gridAutoRows: "10rem" }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-12 sm:gap-14 md:gap-16 overflow-visible justify-items-center isolate"
        >
          {devices.map((d) => {
            const isOn = d.state === "ON";
            return (
              <div key={d.deviceId} className="relative group">
                <button
                  ref={(el) => (anchorRefs.current[d.deviceId] = el)}
                  onClick={() => toggle(d)}
                  onMouseEnter={() => setTooltipId(d.deviceId)}
                  onMouseLeave={() => setTooltipId(null)}
                  onFocus={() => setTooltipId(d.deviceId)}
                  onBlur={() => setTooltipId(null)}
                  onTouchStart={() => {
                    setTooltipId(d.deviceId);
                    // auto-hide on touch after 1.5s
                    setTimeout(() => setTooltipId(null), 1500);
                  }}
                  aria-pressed={isOn}
                  aria-describedby={`tooltip-${d.deviceId}`}
                  className={`w-full max-w-[10rem] h-full p-3 rounded-lg border border-gray-100 transition will-change-transform flex flex-col items-center justify-between text-center gap-2 box-border focus:outline-none focus:ring-2 focus:ring-offset-1 relative z-0 overflow-hidden hover:z-10 ${
                    isOn
                      ? "bg-green-600 text-white shadow-sm ring-1 ring-green-300"
                      : "bg-white text-gray-800 shadow"
                  }`}
                >
                  <div
                    className={`p-2 rounded-full flex items-center justify-center transition-all ${
                      isOn ? "bg-white/10 shadow-sm" : "bg-transparent"
                    }`}
                    aria-hidden
                  >
                    {d.type === "light" ? (
                      <IconLight
                        className={`w-6 h-6 ${
                          isOn ? "text-white" : "text-gray-700"
                        }`}
                      />
                    ) : d.type === "fan" ? (
                      <IconFan
                        className={`w-6 h-6 ${
                          isOn ? "text-white" : "text-gray-700"
                        }`}
                      />
                    ) : (
                      <IconDoor
                        className={`w-6 h-6 ${
                          isOn ? "text-white" : "text-gray-700"
                        }`}
                      />
                    )}
                  </div>

                  <div className="text-left w-full">
                    <div
                      className={`font-medium truncate ${
                        isOn ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {d.deviceId}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {d.type}
                    </div>
                  </div>

                  <div className="w-full">
                    {isOn ? (
                      <span className="inline-block mt-1 px-3 py-1 rounded-md font-semibold text-sm bg-white/20 text-white transition-opacity duration-300 ease-out animate-pulse">
                        ON
                      </span>
                    ) : null}
                  </div>
                </button>

                <Tooltip
                  id={`tooltip-${d.deviceId}`}
                  anchorEl={anchorRefs.current[d.deviceId]}
                  visible={tooltipId === d.deviceId}
                >
                  {d.deviceId}
                </Tooltip>
              </div>
            );
          })}
        </div>
      )}

      <Toast
        message={toast.message}
        visible={toast.visible}
        onClose={() => setToast({ visible: false, message: "" })}
      />
    </div>
  );
};

export default DeviceControls;
