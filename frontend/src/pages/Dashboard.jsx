import { useEffect, useState } from "react";
import { fetchSensorData } from "../services/api";
import SensorCard from "../components/SensorCard";
import FilterControls from "../components/FilterControls";
import AlertBox from "../components/AlertBox";
import DeviceControls from "../components/DeviceControls";
import AutomationControls from "../components/AutomationControls";
import ThermostatSensorCard from "../components/ThermostatSensorCard";
import ActuatorAutomationCard from "../components/ActuatorAutomationCard";
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

  // Group actuators (outputs) and sensors (inputs) for automation controls
  // Assume actuators are those present in DeviceControls, sensors are the rest
  const actuatorIds = ["light_1", "fan_1", "door_1"]; // You can fetch this dynamically if needed
  const sensorDevices = devices.filter((id) => !actuatorIds.includes(id));

  // Group sensors and thermostats by suffix (e.g., sensor_1 + thermostat_1)
  // If you don't have thermostat_x devices, pair sensor_x with itself for demo
  const sensorPairs = sensorDevices.map((sensorId) => {
    // Try to find a matching thermostat by replacing 'sensor' with 'thermostat'
    let thermostatId = sensorId.replace(/^sensor/, "thermostat");
    if (!devices.includes(thermostatId)) thermostatId = sensorId; // fallback
    return { sensorId, thermostatId };
  });

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
          <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
            <h3 className="text-lg font-semibold mb-2">Actuators</h3>
            <DeviceControls />
          </div>
          {/* Output group: Grouped actuator cards with automation controls */}
          <div>
            <h3 className="text-md font-semibold mb-2">
              Automatic Lights & Switches
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {actuatorIds.map((actuatorId) => (
                <ActuatorAutomationCard
                  key={actuatorId}
                  actuatorId={actuatorId}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="lg:col-span-2">
          {/* Grouped Thermostat & Sensor cards */}
          <div className="mb-4">
            <h3 className="text-md font-semibold mb-2">
              Automatic Thermostat & Sensors
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sensorPairs.map(({ sensorId, thermostatId }) => (
                <ThermostatSensorCard
                  key={sensorId}
                  sensorId={sensorId}
                  thermostatId={thermostatId}
                  sensorData={sensorData[sensorId]}
                />
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
