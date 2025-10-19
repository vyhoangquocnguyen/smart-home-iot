import { useEffect, useState } from "react";
import { fetchSensorData } from "../services/api";
import SensorCard from "../components/SensorCard";
import FilterControls from "../components/FilterControls";
import AlertBox from "../components/AlertBox";
import DeviceControls from "../components/DeviceControls";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

const Dashboard = () => {
  const [sensorData, setSensorData] = useState({}); // { deviceId: [history] }
  const [alerts, setAlerts] = useState([]);

  const [filters, setFilters] = useState({
    deviceId: "",
    alertOnly: false,
    windowMinutes: 0,
  });

  useEffect(() => {
    // Fetch initial sensor data
    fetchSensorData().then((data) => {
      const grouped = {};
      data.forEach((sensor) => {
        grouped[sensor.deviceId] = sensor.history;
      });
      setSensorData(grouped);
    });

    // Listen for real-time updates
    socket.on("updateData", (newData) => {
      setSensorData((prev) => {
        const updated = { ...prev };
        if (!updated[newData.deviceId]) updated[newData.deviceId] = [];
        updated[newData.deviceId].unshift(newData); // add latest to front
        return updated;
      });
    });

    // Listen for alerts (add timestamp and id, auto-expire after 10s)
    socket.on("alert", (alert) => {
      const a = {
        ...alert,
        ts: Date.now(),
        id: Math.random().toString(36).slice(2, 9),
      };
      setAlerts((prev) => [a, ...prev].slice(0, 5));
      setTimeout(
        () => setAlerts((prev) => prev.filter((x) => x.id !== a.id)),
        10000
      );
    });

    return () => socket.disconnect();
  }, []);

  // Derived lists for the UI
  const devices = Object.keys(sensorData || []);

  // Apply filter: deviceId and alerts-only (using same thresholds as app: temp>30 or humidity>70)
  const visibleDevices = devices.filter((d) => {
    if (filters.deviceId && filters.deviceId !== d) return false;

    const latest = (sensorData[d] && sensorData[d][0]) || null;

    // Time-window filtering
    if (filters.windowMinutes && filters.windowMinutes > 0) {
      if (!latest || !latest.timestamp) return false;
      const cutoff = Date.now() - filters.windowMinutes * 60 * 1000;
      const ts = new Date(latest.timestamp).getTime();
      if (ts < cutoff) return false;
    }

    if (filters.alertOnly) {
      if (!latest) return false;
      const t = Number(latest.temperature);
      const h = Number(latest.humidity);
      return t > 30 || h > 70;
    }

    return true;
  });

  return (
    <div className="flex flex-col p-6 max-w-7xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Smart Home Dashboard
          </h1>
          <p className="text-sm text-gray-500">
            Real-time sensor telemetry and device controls
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">
            Connected sensors: <strong>{Object.keys(sensorData).length}</strong>
          </div>
          <div className="text-sm text-gray-600">
            Active alerts: <strong>{alerts.length}</strong>
          </div>
        </div>
      </header>
      {/* Filters */}
      <FilterControls
        filters={filters}
        setFilters={setFilters}
        devices={devices}
      />
      {/* Alerts box (minimizable) */}
      <AlertBox
        alerts={alerts}
        onDismiss={(id) => setAlerts((prev) => prev.filter((x) => x.id !== id))}
        onClear={() => setAlerts([])}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-1">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Actuators</h3>
            <DeviceControls />
          </div>
        </section>

        <section className="lg:col-span-2">
          <div className="bg-white rounded-lg p-4 shadow-sm mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Sensors</h3>
              <p className="text-sm text-gray-500">
                Filter and explore sensor history
              </p>
            </div>
            <div className="w-1/2">
              <FilterControls
                filters={filters}
                setFilters={setFilters}
                devices={devices}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleDevices.length === 0 && (
              <p className="text-gray-500">No sensors match current filters.</p>
            )}
            {visibleDevices.map((deviceId) => (
              <SensorCard
                key={deviceId}
                deviceId={deviceId}
                data={sensorData[deviceId]}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
