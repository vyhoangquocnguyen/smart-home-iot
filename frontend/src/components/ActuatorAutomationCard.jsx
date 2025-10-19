import React from "react";
import AutomationControls from "./AutomationControls";

const ActuatorAutomationCard = ({ actuatorId }) => {
  // For now, treat all actuators as 'light' type for automation controls
  // You can extend this to support different types if needed
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <div className="mb-2 font-semibold">{actuatorId}</div>
      <AutomationControls deviceId={actuatorId} type="light" />
    </div>
  );
};

export default ActuatorAutomationCard;
