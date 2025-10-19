// src/services/api.js
import axios from "axios";

const API_URL = "http://localhost:5000/api/sensors";
const DEVICE_API = "http://localhost:5000/api/devices";
const DEVICE_CONTROL_API = "http://localhost:5000/api/device";
const AUTOMATION_API = "http://localhost:5000/api/automation";

// Fetch latest sensor data (history)
export const fetchSensorData = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (err) {
    console.error("Failed to fetch sensor data:", err);
    return [];
  }
};

// Fetch actuator devices and their last known state
export const fetchDevices = async () => {
  try {
    const res = await axios.get(DEVICE_API);
    return res.data;
  } catch (err) {
    console.error("Failed to fetch devices:", err);
    return [];
  }
};

// Send a control command to a device
export const sendDeviceCommand = async ({ type, deviceId, state }) => {
  try {
    const res = await axios.post(DEVICE_CONTROL_API, { type, deviceId, state });
    return res.data;
  } catch (err) {
    console.error("Failed to send device command:", err);
    throw err;
  }
};

// Fetch automation settings
export const fetchAutomationSettings = async () => {
  try {
    const res = await axios.get(AUTOMATION_API);
    return res.data;
  } catch (err) {
    console.error("Failed to fetch automation settings:", err);
    return [];
  }
};

// Create new automation settings
export const createAutomationSettings = async (settings) => {
  try {
    const res = await axios.post(AUTOMATION_API, settings);
    return res.data;
  } catch (err) {
    console.error("Failed to create automation settings:", err);
    throw err;
  }
};

// Update existing automation settings
export const updateAutomationSettings = async (id, settings) => {
  try {
    const res = await axios.put(`${AUTOMATION_API}/${id}`, settings);
    return res.data;
  } catch (err) {
    console.error("Failed to update automation settings:", err);
    throw err;
  }
};
