import express from "express";
import mqtt from "mqtt";

const router = express.Router();
const client = mqtt.connect(process.env.MQTT_URL);

// Optional API key protection
const API_KEY = process.env.API_KEY || null;

// Control devices: type: light|fan|door, optional deviceId, state: ON|OFF
router.post("/", (req, res) => {
  if (API_KEY) {
    const key = req.headers["x-api-key"] || req.query.api_key;
    if (!key || key !== API_KEY)
      return res.status(401).json({ error: "Invalid API key" });
  }

  const { type, deviceId, state } = req.body;

  if (!type || !state)
    return res.status(400).json({ error: "Missing type or state" });

  const topic = `home/${type}/set`;
  const payload = JSON.stringify({ deviceId, state });

  client.publish(topic, payload, (err) => {
    if (err) return res.status(500).json({ error: "MQTT publish failed" });
    res.json({ success: true, type, deviceId, state });
  });
});

export default router;
