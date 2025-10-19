import React from "react";
import SensorCard from "./SensorCard";
import AutomationControls from "./AutomationControls";

const ThermostatSensorCard = ({ sensorId, thermostatId, sensorData }) => {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <div className="mb-2">
        <SensorCard deviceId={sensorId} data={sensorData} />
      </div>
      <div>
        <AutomationControls deviceId={thermostatId} type="thermostat" />
      </div>
    </div>
  );
};

export default ThermostatSensorCard;
