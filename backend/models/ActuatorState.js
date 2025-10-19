import mongoose from "mongoose";

const ActuatorStateSchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true, unique: true },
    type: { type: String, required: true },
    state: { type: String, required: true },
    ts: { type: Date, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("ActuatorState", ActuatorStateSchema);
