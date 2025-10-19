# ESP32 Smart Home Firmware

## Hardware Setup

- **ESP32 Board**
- **DHT22 Sensor**: Data pin to GPIO4, VCC to 3.3V, GND to GND
- **Relay Modules**:
  - Light relay to GPIO16
  - Fan relay to GPIO17
  - Door relay to GPIO18
- **Power**: USB or regulated 3.3V supply

## Wiring Diagram

```
ESP32 GPIO4  ----> DHT22 Data
ESP32 GPIO16 ----> Light Relay IN
ESP32 GPIO17 ----> Fan Relay IN
ESP32 GPIO18 ----> Door Relay IN
```

## Firmware Features

- Reads temperature/humidity from DHT22
- Publishes sensor data to MQTT topic `home/sensors`
- Subscribes to actuator topics (`home/light`, `home/fan`, `home/door`)
- Controls relays based on MQTT commands

## Configuration

- Edit `config.h` for pin/device mapping
- Edit WiFi/MQTT credentials in `smart_home_esp32.ino`

## Flashing

- Use Arduino IDE or PlatformIO
- Install libraries: `WiFi`, `PubSubClient`, `DHT sensor library`
- Upload to ESP32
