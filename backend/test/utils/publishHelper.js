import mqtt from "mqtt";

export function publishState({
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
