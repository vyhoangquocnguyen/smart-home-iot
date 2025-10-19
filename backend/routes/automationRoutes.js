import express from "express";
import {
  getSettings,
  updateSettings,
  createSettings,
} from "../controllers/automationController.js";

const router = express.Router();

router.get("/", getSettings);
router.post("/", createSettings);
router.put("/:id", updateSettings);

export default router;
