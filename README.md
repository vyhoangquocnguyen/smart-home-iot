Reposistory for SmartHomeX (ESP32, MQTT, Node.js backend, React frontend)

## Running simulations (all-in-one)

This repo includes utilities to run a local simulation environment (MQTT broker, backend, frontend, sensor simulator, and actuator seeders).

Use the PowerShell helper script `scripts/run-simulations.ps1` to start the common pieces. It supports a dry-run mode which prints the commands instead of launching them.

Examples:

Dry run (print commands):

```powershell
.\scripts\run-simulations.ps1 -DryRun
```

Start everything (requires Docker for Mosquitto or a local mosquitto install, and a running MongoDB instance):

```powershell
.\scripts\run-simulations.ps1
```

The script will:

- Optionally start Mosquitto using Docker (or print the local mosquitto command)
- Launch the backend (nodemon) with environment variables for MQTT and Mongo
- Launch the frontend (Vite dev server)
- Seed actuator rows into MongoDB with `backend/scripts/upsertActuators.js`
- Start the sensor simulator `backend/simulateSensors.js` which publishes to `home/sensors` every 3s
- Publish initial actuator states to `home/<type>/state`

If you prefer to run pieces manually, see the `backend/` and `frontend/` folders for local run instructions and scripts.

## Cross-platform runner (Node)

If you prefer a cross-platform runner (works on macOS, Linux, Windows), use the Node helper:

Dry run (print commands):

```bash
node ./scripts/run-simulations.js --dry-run
```

Start the simulation (this will spawn child processes and stream logs to your terminal):

```bash
node ./scripts/run-simulations.js
```

You can disable Docker mosquitto with `--no-docker` and override MQTT/Mongo URIs with `--mqttUrl` and `--mongoUri`.
