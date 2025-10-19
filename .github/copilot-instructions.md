This repository implements a small smart-home IoT demo with a Node/Express backend, MQTT integration, Socket.IO real-time updates, and a Vite + React frontend using Tailwind.

Use these instructions to guide code suggestions and edits. Keep changes small and aligned with existing patterns.

- Big picture
  - Backend: `backend/server.js` (Express + Socket.IO). It subscribes to MQTT topic `home/sensors`, writes to MongoDB (`backend/models/SensorData.js`), and emits `updateData` and `alert` Socket.IO events.
  - Frontend: `frontend/src` (Vite + React). `App.jsx` mounts `pages/Dashboard.jsx` which fetches history from `GET /api/sensors` (`frontend/src/services/api.js`) and connects to Socket.IO at `http://localhost:5000` to receive `updateData` and `alert` events.
  - Device control: `backend/routes/deviceRoutes.js` publishes MQTT messages to `home/<deviceType>` to control actuators (light, fan, door).

- Where state and data lives
  - Persistent sensor history is in MongoDB via Mongoose model `SensorData` (`backend/models/SensorData.js`). Aggregation in `backend/routes/sensorRoutes.js` groups the latest readings per `deviceId`.
  - Real-time ephemeral updates travel over Socket.IO events `updateData` and `alert` (emitted from `server.js`). The frontend `Dashboard.jsx` listens and prepends new readings to local state.

- Developer workflows & important commands
  - Backend: run `npm run dev` inside `backend/` to start the server with nodemon. Environment variables are required: `MQTT_URL`, `MONGO_URI`, optionally `PORT` (default 5000). See `backend/package.json`.
  - Backend MQTT simulator: run `node simulateSensors.js` in `backend/` (ensure `MQTT_URL` points to the broker). This publishes sample messages to `home/sensors` every 3s.
  - Frontend: run `npm run dev` in `frontend/` (Vite). Production build: `npm run build`.
  - Socket.IO URL is hard-coded in `frontend/src/pages/Dashboard.jsx` as `http://localhost:5000` — update when running backend on another host/port.

- Project-specific conventions & patterns
  - ES modules throughout (package.json uses `type: "module"`). Use import/export, not CommonJS require/module.exports.
  - Keep controller logic lean: backend routes delegate to Mongoose and MQTT; prefer editing `backend/server.js` only for global socket/mqtt wiring.
  - Frontend expects sensor history arrays with newest entry first (see `Dashboard.jsx` and `SensorCard.jsx` where `data[0]` is treated as latest). When emitting or inserting new readings, prepend (unshift) to maintain this order.
  - Alerts threshold behavior: both backend and frontend use the same thresholds (temp > 30, humidity > 70). Avoid duplicating differing thresholds unless intentionally changing behavior.

- Integration points to be careful with
  - MQTT topics: `home/sensors` (ingest), `home/<device>` (actuator commands). Tests or features that publish/subscribe must use exact topic names.
  - Socket.IO events: `updateData`, `alert`. Event payloads are Mongoose documents (backend emits saved document). Frontend assumes `timestamp`, `temperature`, `humidity`, and `deviceId` fields.
  - MongoDB connection: `MONGO_URI` must be set. The aggregation in `sensorRoutes.js` sorts by `timestamp` and groups by `deviceId`; changing this query affects frontend expectations.

- Examples to mirror
  - Add a new sensor-route: follow `backend/routes/sensorRoutes.js` aggregation pattern and return objects shaped { deviceId, history } where `history[0]` is latest.
  - Emit a new Socket.IO event: use `io.emit("eventName", payload)` from `backend/server.js` where `payload` is the Mongoose-created record so frontend can render immediately.

- Tests, linting, and safety
  - There are no automated tests included; run linters manually: `npm run lint` in `frontend/` for ESLint checks.
  - Avoid committing secrets: `.env` is used but not tracked — ensure `MONGO_URI` and `MQTT_URL` are configured in local environment or CI secrets.

If anything is unclear or you'd like the instructions to emphasize different areas (CI, Docker, MOSQUITTO config under `mosquitto/`, or contributing guidelines), tell me which part to expand and I'll iterate.
