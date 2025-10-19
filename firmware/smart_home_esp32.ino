// Smart Home ESP32 Firmware
#include <WiFi.h>
#include <PubSubClient.h>
// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
// MQTT broker
const char* mqtt_server = "YOUR_MQTT_BROKER_IP";
const int mqtt_port = 1883;
// Device IDs
const char* deviceId = "sensor_1";

// DHT sensor
#define DHTPIN 4      // GPIO4
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

// Relay pins
#define LIGHT_PIN 16
#define FAN_PIN 17
#define DOOR_PIN 18

WiFiClient espClient;
PubSubClient client(espClient);

void setup_wifi() {
  delay(10);
  WiFi.begin(ssid, password);
void callback(char* topic, byte* payload, unsigned int length) {
  String msg;
  for (int i = 0; i < length; i++) msg += (char)payload[i];
void reconnect() {
  while (!client.connected()) {
    if (client.connect(deviceId)) {
void setup() {
  pinMode(LIGHT_PIN, OUTPUT);
  pinMode(FAN_PIN, OUTPUT);
void loop() {
  if (!client.connected()) reconnect();
  client.loop();
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  if (!isnan(h) && !isnan(t)) {
    String payload = "{\"deviceId\":\"sensor_1\",\"temperature\":" + String(t) + ",\"humidity\":" + String(h) + "}";
    client.publish("home/sensors", payload.c_str());
  }
#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// MQTT broker
const char* mqtt_server = "YOUR_MQTT_BROKER_IP";
const int mqtt_port = 1883;

// Device IDs
const char* deviceId = "sensor_1";

// DHT sensor
#define DHTPIN 4      // GPIO4
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

// Relay pins
#define LIGHT_PIN 16
#define FAN_PIN 17
#define DOOR_PIN 18

WiFiClient espClient;
PubSubClient client(espClient);

void setup_wifi() {
  delay(10);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }
}

void callback(char* topic, byte* payload, unsigned int length) {
  String msg;
  for (int i = 0; i < length; i++) msg += (char)payload[i];
  if (String(topic) == "home/light") digitalWrite(LIGHT_PIN, msg == "on" ? HIGH : LOW);
  if (String(topic) == "home/fan") digitalWrite(FAN_PIN, msg == "on" ? HIGH : LOW);
  if (String(topic) == "home/door") digitalWrite(DOOR_PIN, msg == "on" ? HIGH : LOW);
}

void reconnect() {
  while (!client.connected()) {
    if (client.connect(deviceId)) {
      client.subscribe("home/light");
      client.subscribe("home/fan");
      client.subscribe("home/door");
    } else {
      delay(5000);
    }
  }
}

void setup() {
  pinMode(LIGHT_PIN, OUTPUT);
  pinMode(FAN_PIN, OUTPUT);
  pinMode(DOOR_PIN, OUTPUT);
  dht.begin();
  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}

void loop() {
  if (!client.connected()) reconnect();
  client.loop();

  float h = dht.readHumidity();
  float t = dht.readTemperature();
  if (!isnan(h) && !isnan(t)) {
    String payload = "{\"deviceId\":\"sensor_1\",\"temperature\":" + String(t) + ",\"humidity\":" + String(h) + "}";
    client.publish("home/sensors", payload.c_str());
  }
  delay(5000); // Publish every 5 seconds
}