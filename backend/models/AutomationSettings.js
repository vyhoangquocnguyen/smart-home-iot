import mongoose from "mongoose";

const automationSettingsSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
  },
  deviceType: {
    type: String,
    enum: ["light", "thermostat"],
    required: true,
  },
  isEnabled: {
    type: Boolean,
    default: false,
  },
  // For lights
  scheduledTime: {
    start: String, // HH:mm format
    end: String, // HH:mm format
  },
  useSunsetControl: {
    type: Boolean,
    default: false,
  },
  // For thermostat
  targetTemperature: {
    type: Number,
    min: 16, // min 16°C
    max: 30, // max 30°C
  },
  tolerance: {
    type: Number,
    default: 1.0, // ±1°C tolerance
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt timestamp before saving
automationSettingsSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const AutomationSettings = mongoose.model(
  "AutomationSettings",
  automationSettingsSchema
);

export default AutomationSettings;
