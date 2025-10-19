import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import mongoose from "mongoose";
import mqtt from "mqtt";
import cors from "cors";
import dotenv from "dotenv";
import SensorData from "./models/SensorData.js";
import ActuatorState from "./models/ActuatorState.js";
import sensorRoutes from "./routes/sensorRoutes.js";
import deviceRoutes from "./routes/deviceRoutes.js";
import automationRoutes from "./routes/automationRoutes.js";
import { handleAutomation } from "./controllers/automationController.js";

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, { cors: { origin: "*" } });

// In-memory actuator state cache (mirrors DB): { [deviceId]: { type, state, ts } }
const actuatorStates = {};

const DEMO_MODE = process.env.DEMO_MODE === "true";

// Load persisted actuator states into memory on startup
const loadPersistedActuators = async () => {
  try {
    const rows = await ActuatorState.find({}).lean();
    rows.forEach((r) => {
      actuatorStates[r.deviceId] = {
        type: r.type,
        state: r.state,
        ts: r.ts.getTime(),
      };
    });
    // Emit to clients
    Object.keys(actuatorStates).forEach((deviceId) =>
      io.emit("deviceState", { deviceId, ...actuatorStates[deviceId] })
    );
  } catch (err) {
    console.error("❌ Failed to load persisted actuators:", err);
  }
};

const PORT = process.env.PORT || 5000;
const MQTT_URL = process.env.MQTT_URL;
const MONGO_URI = process.env.MONGO_URI;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Routes ---
app.use("/api/sensors", sensorRoutes);
app.use("/api/device", deviceRoutes);
app.use("/api/automation", automationRoutes);

// --- MongoDB ---
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// --- MQTT ---
const mqttClient = mqtt.connect(MQTT_URL);

mqttClient.on("connect", () => {
  console.log("✅ MQTT Connected");
  // Subscribe to sensors, actuator state topics and actuator set commands
  mqttClient.subscribe(["home/sensors", "home/+/state", "home/+/set"]);
  // load persisted actuators
  loadPersistedActuators();
  // optionally seed demo actuators when DEMO_MODE is enabled and no persisted devices exist
  if (DEMO_MODE && Object.keys(actuatorStates).length === 0) {
    const now = Date.now();
    actuatorStates["light_1"] = { type: "light", state: "OFF", ts: now };
    actuatorStates["fan_1"] = { type: "fan", state: "OFF", ts: now };
    actuatorStates["door_1"] = { type: "door", state: "OFF", ts: now };
    Object.keys(actuatorStates).forEach((deviceId) => {
      io.emit("deviceState", { deviceId, ...actuatorStates[deviceId] });
    });
  }
});

mqttClient.on("message", async (topic, message) => {
  if (topic === "home/sensors") {
    try {
      const data = JSON.parse(message.toString());
      if (!data.deviceId)
        return console.warn("⚠️ Missing deviceId in MQTT message");

      const newData = await SensorData.create({
        deviceId: data.deviceId,
        temperature: data.temperature,
        humidity: data.humidity,
        timestamp: new Date(),
      });

      // Emit real-time update
      io.emit("updateData", newData);

      // Handle automation based on sensor data
      await handleAutomation(data);

      // Alert example
      if (data.temperature > 30 || data.humidity > 70) {
        io.emit("alert", {
          deviceId: data.deviceId,
          temperature: data.temperature,
          humidity: data.humidity,
        });
      }

      console.log("📥 Saved MQTT data:", newData);
    } catch (err) {
      console.error("❌ Invalid MQTT message:", err);
    }
  } else {
    // Handle actuator-related topics
    try {
      const parts = topic.split("/");
      // state messages from devices: topic = home/<type>/state
      if (parts.length === 3 && parts[0] === "home" && parts[2] === "state") {
        const type = parts[1];
        const data = JSON.parse(message.toString());
        if (!data.deviceId)
          return console.warn("⚠️ Missing deviceId in actuator state");

        const ts = data.ts ? new Date(data.ts).getTime() : Date.now();
        const stateObj = {
          type,
          state: data.state,
          ts,
        };

        actuatorStates[data.deviceId] = stateObj;

        // persist to MongoDB (upsert)
        try {
          await ActuatorState.findOneAndUpdate(
            { deviceId: data.deviceId },
            {
              deviceId: data.deviceId,
              type,
              state: data.state,
              ts: new Date(ts),
            },
            { upsert: true, new: true }
          );
        } catch (err) {
          console.error("❌ Failed to persist actuator state:", err);
        }

        // Emit real-time device state
        io.emit("deviceState", { deviceId: data.deviceId, ...stateObj });

        console.log("🔁 Actuator state updated:", data.deviceId, stateObj);
        return;
      }

      // set commands sent to devices: topic = home/<type>/set
      if (parts.length === 3 && parts[0] === "home" && parts[2] === "set") {
        const type = parts[1];
        const data = JSON.parse(message.toString());
        // If deviceId not provided, synthesize one
        const deviceId = data.deviceId || `${type}_1`;
        const state = data.state;
        if (!state)
          return console.warn("⚠️ Missing state in actuator set command");

        // If DEMO_MODE is enabled, simulate the device by publishing its state back
        if (DEMO_MODE) {
          const payload = JSON.stringify({ deviceId, state, ts: Date.now() });
          mqttClient.publish(`home/${type}/state`, payload, (err) => {
            if (err)
              return console.error(
                "❌ Failed to publish simulated state:",
                err
              );
            console.log(
              "📤 Simulated device state published:",
              `home/${type}/state`,
              payload
            );
          });
          return;
        }

        // In non-demo mode we don't auto-respond — real devices should publish state to home/<type>/state
        return;
      }
    } catch (err) {
      console.error("❌ Invalid actuator message:", err);
    }
  }
});

// --- Socket.IO ---
io.on("connection", (socket) => {
  console.log("🔌 Frontend connected:", socket.id);
  socket.on("disconnect", () =>
    console.log("❌ Frontend disconnected:", socket.id)
  );
});

// --- Start server ---
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// Devices state endpoint
app.get("/api/devices", (req, res) => {
  try {
    const result = Object.keys(actuatorStates).map((deviceId) => ({
      deviceId,
      ...actuatorStates[deviceId],
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Admin endpoints for tests / debugging
app.get("/api/admin/actuators", async (req, res) => {
  try {
    const rows = await ActuatorState.find({}).lean();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/api/admin/actuators/:deviceId", async (req, res) => {
  try {
    const { deviceId } = req.params;
    await ActuatorState.deleteOne({ deviceId });
    // remove from in-memory cache if present
    if (actuatorStates[deviceId]) delete actuatorStates[deviceId];
    // notify clients a device was removed
    io.emit("deviceRemoved", { deviceId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
