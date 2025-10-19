import express from "express";
import SensorData from "../models/SensorData.js";

const router = express.Router();

// Get last N readings per sensor
router.get("/", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    // Group data by deviceId
    const sensors = await SensorData.aggregate([
      { $sort: { timestamp: -1 } },
      { $group: { _id: "$deviceId", history: { $push: "$$ROOT" } } },
    ]);

    // Limit the history for each sensor
    const result = sensors.map((s) => ({
      deviceId: s._id,
      history: s.history.slice(0, limit),
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
