// Pin and device configuration for ESP32 Smart Home
#define DHTPIN 4      // GPIO for DHT22 sensor
#define DHTTYPE DHT22 // Sensor type
#define LIGHT_PIN 16  // GPIO for light relay
#define FAN_PIN 17    // GPIO for fan relay
#define DOOR_PIN 18   // GPIO for door relay

// Device IDs for MQTT
#define SENSOR_ID "sensor_1"
#define LIGHT_ID "light_1"
#define FAN_ID "fan_1"
#define DOOR_ID "door_1"
