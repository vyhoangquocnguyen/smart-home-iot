import AutomationSettings from "../models/AutomationSettings.js";
import mqtt from "mqtt";

const client = mqtt.connect(process.env.MQTT_URL);

// Utility function to check if current time is between start and end
const isTimeBetween = (start, end) => {
  const current = new Date();
  const [startHours, startMinutes] = start.split(":").map(Number);
  const [endHours, endMinutes] = end.split(":").map(Number);

  const currentTime = current.getHours() * 60 + current.getMinutes();
  const startTime = startHours * 60 + startMinutes;
  const endTime = endHours * 60 + endMinutes;

  return currentTime >= startTime && currentTime <= endTime;
};

// Utility function to check if it's after sunset (simplified)
const isAfterSunset = () => {
  const current = new Date();
  const hour = current.getHours();
  // Simplified sunset detection - assume sunset is at 18:00 (6 PM)
  return hour >= 18;
};

export const handleAutomation = async (sensorData) => {
  try {
    const { deviceId, temperature } = sensorData;

    // Handle thermostat automation
    const thermostatSettings = await AutomationSettings.findOne({
      deviceId,
      deviceType: "thermostat",
      isEnabled: true,
    });

    if (thermostatSettings) {
      const { targetTemperature, tolerance } = thermostatSettings;
      if (Math.abs(temperature - targetTemperature) > tolerance) {
        const action = temperature > targetTemperature ? "on" : "off";
        client.publish(
          "home/fan",
          JSON.stringify({
            deviceId,
            action,
            automated: true,
          })
        );
      }
    }

    // Handle light automation
    const lightSettings = await AutomationSettings.findOne({
      deviceId,
      deviceType: "light",
      isEnabled: true,
    });

    if (lightSettings) {
      const { scheduledTime, useSunsetControl } = lightSettings;
      let shouldTurnOn = false;

      if (scheduledTime) {
        shouldTurnOn = isTimeBetween(scheduledTime.start, scheduledTime.end);
      }

      if (useSunsetControl) {
        shouldTurnOn = shouldTurnOn || isAfterSunset();
      }

      client.publish(
        "home/light",
        JSON.stringify({
          deviceId,
          action: shouldTurnOn ? "on" : "off",
          automated: true,
        })
      );
    }
  } catch (error) {
    console.error("Automation error:", error);
  }
};

export const getSettings = async (req, res) => {
  try {
    const settings = await AutomationSettings.find();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const update = req.body;

    const settings = await AutomationSettings.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });

    if (!settings) {
      return res.status(404).json({ error: "Settings not found" });
    }

    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createSettings = async (req, res) => {
  try {
    const settings = new AutomationSettings(req.body);
    await settings.save();
    res.status(201).json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
