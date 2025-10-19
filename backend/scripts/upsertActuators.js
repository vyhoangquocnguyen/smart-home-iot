import mongoose from "mongoose";
import ActuatorState from "../models/ActuatorState.js";

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/smarthome";

async function main() {
  await mongoose.connect(MONGO_URI);
  const now = new Date();
  const devices = [
    { deviceId: "light_1", type: "light", state: "OFF", ts: now },
    { deviceId: "fan_1", type: "fan", state: "OFF", ts: now },
    { deviceId: "door_1", type: "door", state: "OFF", ts: now },
  ];
  for (const d of devices) {
    await ActuatorState.findOneAndUpdate({ deviceId: d.deviceId }, d, {
      upsert: true,
      new: true,
    });
    console.log("upserted", d.deviceId);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
