<#
Run-simulations.ps1
Utility to launch the local simulation suite for the smart-home demo.

Usage examples:
  # Dry run (prints commands):
  .\run-simulations.ps1 -DryRun

  # Start everything (requires Docker for Mosquitto or an existing broker and MongoDB running):
  .\run-simulations.ps1

This script attempts to be conservative and not kill existing processes. It uses separate PowerShell windows for long-running services by default.
#>
param(
  [switch]$DryRun,
  [switch]$UseDockerMosquitto = $true,
  [string]$MqttUrl = 'mqtt://localhost:1883',
  [string]$MongoUri = 'mongodb://localhost:27017/smarthome',
  [int]$BackendPort = 5000
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$root = Split-Path -Parent $scriptDir  # repo root (parent of scripts/)
$backend = Join-Path $root 'backend'
$frontend = Join-Path $root 'frontend'

function RunOrPrint($cmd, $title){
  if($DryRun){
    Write-Host '[DRYRUN] ' $title
    Write-Host '  ' $cmd -ForegroundColor Cyan
    Write-Host ''
  } else {
    Write-Host "Starting: $title" -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit","-Command","$cmd"
  }
}

# 1) Mosquitto (Docker) optional
if($UseDockerMosquitto){
  $mosCmd = "docker run -it --rm -p 1883:1883 -v `"$root\mosquitto\config\mosquitto.conf`":/mosquitto/config/mosquitto.conf eclipse-mosquitto:2"
  RunOrPrint $mosCmd "Mosquitto (Docker)"
} else {
  $mosCmd = "mosquitto -c $root\mosquitto\config\mosquitto.conf"
  RunOrPrint $mosCmd "Mosquitto (local)"
}

# 2) Backend
$envSetup = "`$env:MQTT_URL='$MqttUrl'; `$env:MONGO_URI='$MongoUri'; `$env:DEMO_MODE='true'; cd $backend; npm run dev"
RunOrPrint $envSetup "Backend (nodemon)"

# 3) Frontend (Vite)
$feCmd = "cd $frontend; npm run dev"
RunOrPrint $feCmd "Frontend (Vite)"

# 4) Upsert actuators (one-shot)
$upsertCmd = "cd $backend; node .\scripts\upsertActuators.js"
RunOrPrint $upsertCmd "Seed actuators (upsert)"

# 5) Sensor simulator
$sensorCmd = "`$env:MQTT_URL='$MqttUrl'; cd $backend; node .\simulateSensors.js"
RunOrPrint $sensorCmd "Sensor simulator"

# 6) Publish initial actuator states (one-shot)
$publishCmd = "cd $backend; node .\scripts\publishStates.js"
RunOrPrint $publishCmd "Publish initial actuator states (one-shot)"

Write-Host "Run-simulations script finished. If not DryRun, check the opened windows for logs." -ForegroundColor Yellow
