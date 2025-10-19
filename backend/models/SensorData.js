import mongoose from "mongoose";

const SensorDataSchema = new mongoose.Schema({
  deviceId: { type: String, required: true },
  temperature: Number,
  humidity: Number,
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model("SensorData", SensorDataSchema);
