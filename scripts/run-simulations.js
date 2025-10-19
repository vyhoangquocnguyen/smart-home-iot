#!/usr/bin/env node
/**
 * Cross-platform simulation runner
 * Usage: node scripts/run-simulations.js [--dry-run] [--no-docker] [--mqttUrl=mqtt://localhost:1883] [--mongoUri=mongodb://localhost:27017/smarthome]
 */
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    dryRun: false,
    useDocker: true,
    mqttUrl: "mqtt://localhost:1883",
    mongoUri: "mongodb://localhost:27017/smarthome",
  };
  args.forEach((a) => {
    if (a === "--dry-run" || a === "-d") opts.dryRun = true;
    if (a === "--no-docker") opts.useDocker = false;
    if (a.startsWith("--mqttUrl=")) opts.mqttUrl = a.split("=")[1];
    if (a.startsWith("--mongoUri=")) opts.mongoUri = a.split("=")[1];
  });
  return opts;
}

function buildCommands(opts) {
  const __filename = fileURLToPath(import.meta.url);
  const repoRoot = path.resolve(__filename, "..", "..");
  const backendDir = path.join(repoRoot, "backend");
  const frontendDir = path.join(repoRoot, "frontend");
  const mosquittoConf = path.join(
    repoRoot,
    "mosquitto",
    "config",
    "mosquitto.conf"
  );

  const cmds = [];

  if (opts.useDocker) {
    cmds.push({
      name: "mosquitto",
      cmd: `docker run -it --rm -p 1883:1883 -v "${mosquittoConf}:/mosquitto/config/mosquitto.conf" eclipse-mosquitto:2`,
      cwd: repoRoot,
    });
  } else {
    cmds.push({
      name: "mosquitto",
      cmd: `mosquitto -c "${mosquittoConf}"`,
      cwd: repoRoot,
    });
  }

  cmds.push({
    name: "backend",
    cmd: `npm run dev`,
    cwd: backendDir,
    env: {
      MQTT_URL: opts.mqttUrl,
      MONGO_URI: opts.mongoUri,
      DEMO_MODE: "true",
    },
  });
  cmds.push({ name: "frontend", cmd: `npm run dev`, cwd: frontendDir });

  // one-shot utilities
  cmds.push({
    name: "upsertActuators",
    cmd: `node ./scripts/upsertActuators.js`,
    cwd: backendDir,
    once: true,
  });
  cmds.push({
    name: "sensorSimulator",
    cmd: `node ./simulateSensors.js`,
    cwd: backendDir,
  });
  cmds.push({
    name: "publishStates",
    cmd: `node ./scripts/publishStates.js`,
    cwd: backendDir,
    once: true,
  });

  return cmds;
}

function printCommands(cmds) {
  console.log("\nCommands:");
  cmds.forEach((c) => {
    console.log(`- ${c.name}: (cwd: ${c.cwd})`);
    console.log(`    ${c.cmd}\n`);
  });
}

function spawnProcess(c) {
  const env = { ...process.env, ...(c.env || {}) };
  const child = spawn(c.cmd, { shell: true, cwd: c.cwd, env });
  child.stdout.on("data", (d) => {
    process.stdout.write(`[${c.name}] ${d}`);
  });
  child.stderr.on("data", (d) => {
    process.stderr.write(`[${c.name}] ${d}`);
  });
  child.on("exit", (code) => {
    console.log(`[${c.name}] exited with ${code}`);
  });
  return child;
}

async function main() {
  const opts = parseArgs();
  const cmds = buildCommands(opts);
  if (opts.dryRun) {
    printCommands(cmds);
    process.exit(0);
  }

  // spawn long-running services first
  const children = [];
  for (const c of cmds) {
    if (c.once) continue; // skip one-shot for now
    console.log(`Starting ${c.name}...`);
    children.push(spawnProcess(c));
    // small pause to avoid overwhelming console
    await new Promise((r) => setTimeout(r, 500));
  }

  // run one-shot commands sequentially
  for (const c of cmds.filter((x) => x.once)) {
    console.log(`Running one-shot: ${c.name}...`);
    await new Promise((resolve, reject) => {
      const p = spawn(c.cmd, {
        shell: true,
        cwd: c.cwd,
        env: { ...process.env, ...(c.env || {}) },
      });
      p.stdout.on("data", (d) => process.stdout.write(`[${c.name}] ${d}`));
      p.stderr.on("data", (d) => process.stderr.write(`[${c.name}] ${d}`));
      p.on("exit", (code) => {
        resolve(code);
      });
    });
  }

  // handle termination
  process.on("SIGINT", () => {
    console.log("\nShutting down children...");
    children.forEach((ch) => {
      try {
        ch.kill();
      } catch (e) {}
    });
    process.exit(0);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
