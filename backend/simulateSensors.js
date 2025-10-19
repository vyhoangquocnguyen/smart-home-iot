import mqtt from "mqtt";
import dotenv from "dotenv";

dotenv.config();

const MQTT_URL = process.env.MQTT_URL;
const client = mqtt.connect(MQTT_URL);

const sensors = ["sensor_1", "sensor_2", "sensor_3"];

client.on("connect", () => {
  console.log("✅ MQTT Simulator Connected");

  setInterval(() => {
    sensors.forEach((id) => {
      const data = {
        deviceId: id,
        temperature: (20 + Math.random() * 15).toFixed(1), // 20-35°C
        humidity: (40 + Math.random() * 40).toFixed(1), // 40-80%
      };
      client.publish("home/sensors", JSON.stringify(data));
      console.log("📤 Sent:", data);
    });
  }, 3000); // every 3 seconds
});
