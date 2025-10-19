import mqtt from "mqtt";

export async function publishState({
  mqttUrl = process.env.MQTT_URL || "mqtt://localhost:1883",
  type,
  deviceId,
  state,
  ts = Date.now(),
}) {
  return new Promise((resolve, reject) => {
    const client = mqtt.connect(mqttUrl);
    client.on("connect", () => {
      const topic = `home/${type}/state`;
      const payload = JSON.stringify({ deviceId, state, ts });
      client.publish(topic, payload, { qos: 0 }, (err) => {
        client.end(false, () => {
          if (err) return reject(err);
          resolve({ topic, payload });
        });
      });
    });
    client.on("error", (e) => reject(e));
  });
}

// CLI behavior: publish a fixed set when run directly
if (process.argv[1] && process.argv[1].endsWith("publishStates.js")) {
  const mqttUrl = process.env.MQTT_URL || "mqtt://localhost:1883";
  const now = Date.now();
  const devices = [
    { deviceId: "light_1", type: "light", state: "OFF", ts: now },
    { deviceId: "fan_1", type: "fan", state: "OFF", ts: now },
    { deviceId: "door_1", type: "door", state: "OFF", ts: now },
  ];
  (async () => {
    try {
      for (const d of devices) {
        const r = await publishState({
          mqttUrl,
          type: d.type,
          deviceId: d.deviceId,
          state: d.state,
          ts: d.ts,
        });
        console.log("Published", r.topic, r.payload);
      }
      process.exit(0);
    } catch (e) {
      console.error("Publish error", e);
      process.exit(1);
    }
  })();
}
