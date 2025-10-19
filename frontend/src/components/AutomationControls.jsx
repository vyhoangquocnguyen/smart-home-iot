import React, { useState, useEffect } from "react";
import {
  fetchAutomationSettings,
  updateAutomationSettings,
  createAutomationSettings,
} from "../services/api";

const AutomationControls = ({ deviceId, type }) => {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const loadSettings = async () => {
      const all = await fetchAutomationSettings();
      const found = all.find(
        (s) => s.deviceId === deviceId && s.deviceType === type
      );
      if (found) setSettings(found);
      else {
        if (type === "light") {
          setSettings({
            deviceId,
            deviceType: "light",
            isEnabled: false,
            scheduledTime: { start: "18:00", end: "06:00" },
            useSunsetControl: false,
          });
        } else if (type === "thermostat") {
          setSettings({
            deviceId,
            deviceType: "thermostat",
            isEnabled: false,
            targetTemperature: 22,
            tolerance: 1.0,
          });
        }
      }
    };
    loadSettings();
  }, [deviceId, type]);

  const handleChange = async (changes) => {
    const updated = { ...settings, ...changes };
    if (settings && settings._id) {
      await updateAutomationSettings(settings._id, updated);
    } else {
      await createAutomationSettings(updated);
    }
    setSettings(updated);
  };

  if (!settings) return null;

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      {type === "light" && (
        <>
          <h3 className="text-lg font-semibold mb-4">Light Automation</h3>
          <label className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={settings.isEnabled}
              onChange={(e) => handleChange({ isEnabled: e.target.checked })}
              className="mr-2"
            />
            Enable Light Automation
          </label>
          {settings.isEnabled && (
            <>
              <div className="mb-2">
                <label className="block text-sm mb-1">Schedule</label>
                <div className="flex space-x-4">
                  <input
                    type="time"
                    value={settings.scheduledTime.start}
                    onChange={(e) =>
                      handleChange({
                        scheduledTime: {
                          ...settings.scheduledTime,
                          start: e.target.value,
                        },
                      })
                    }
                    className="border rounded p-1"
                  />
                  <span>to</span>
                  <input
                    type="time"
                    value={settings.scheduledTime.end}
                    onChange={(e) =>
                      handleChange({
                        scheduledTime: {
                          ...settings.scheduledTime,
                          end: e.target.value,
                        },
                      })
                    }
                    className="border rounded p-1"
                  />
                </div>
              </div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.useSunsetControl}
                  onChange={(e) =>
                    handleChange({ useSunsetControl: e.target.checked })
                  }
                  className="mr-2"
                />
                Turn on at sunset
              </label>
            </>
          )}
        </>
      )}
      {type === "thermostat" && (
        <>
          <h3 className="text-lg font-semibold mb-4">Thermostat Automation</h3>
          <label className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={settings.isEnabled}
              onChange={(e) => handleChange({ isEnabled: e.target.checked })}
              className="mr-2"
            />
            Enable Temperature Control
          </label>
          {settings.isEnabled && (
            <>
              <div className="mb-2">
                <label className="block text-sm mb-1">
                  Target Temperature (°C)
                </label>
                <input
                  type="number"
                  min="16"
                  max="30"
                  value={settings.targetTemperature}
                  onChange={(e) =>
                    handleChange({ targetTemperature: Number(e.target.value) })
                  }
                  className="border rounded p-1"
                />
              </div>
              <div className="mb-2">
                <label className="block text-sm mb-1">
                  Temperature Tolerance (±°C)
                </label>
                <input
                  type="number"
                  min="0.5"
                  max="2"
                  step="0.5"
                  value={settings.tolerance}
                  onChange={(e) =>
                    handleChange({ tolerance: Number(e.target.value) })
                  }
                  className="border rounded p-1"
                />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default AutomationControls;
