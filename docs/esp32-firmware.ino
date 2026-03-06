
/**
 * KeyFlow Pro - ESP32 Cabinet Firmware v1.0.4
 * -----------------------------------------
 * Features:
 * - WiFi Connection
 * - Real-time Firestore Trigger Monitoring (Unlock & OTA Update)
 * - Hardware State Reporting (Peg presence & Door state)
 * - Heartbeat/Health Monitoring
 * - OTA Over-the-Air Update Capability
 */

#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <HTTPClient.h>
#include <Update.h>

// --- Configuration ---
#define WIFI_SSID "Your_WiFi_SSID"
#define WIFI_PASSWORD "Your_WiFi_Password"

#define API_KEY "AIzaSy..." // From Firebase Console
#define DATABASE_URL "https://your-project-id.firebaseio.com"

// Pin Assignments
#define SOLENOID_PIN 12
#define DOOR_SENSOR_PIN 13
#define STATUS_LED_PIN 2

// State Variables
String firmwareVersion = "1.0.4";
int pegCount = 10;
bool isCabinetUnlocked = false;

// Firebase objects
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

void setup() {
  Serial.begin(115200);
  pinMode(SOLENOID_PIN, OUTPUT);
  pinMode(STATUS_LED_PIN, OUTPUT);
  pinMode(DOOR_SENSOR_PIN, INPUT_PULLUP);

  setupWiFi();
  setupFirebase();
}

void loop() {
  if (Firebase.ready()) {
    // 1. Monitor for Hardware Triggers
    checkHardwareTriggers();

    // 2. Report Status (Heartbeat) every 30 seconds
    static unsigned long lastHeartbeat = 0;
    if (millis() - lastHeartbeat > 30000) {
      sendHeartbeat();
      lastHeartbeat = millis();
    }
  }
}

void setupWiFi() {
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    digitalWrite(STATUS_LED_PIN, !digitalRead(STATUS_LED_PIN));
    Serial.print(".");
  }
  digitalWrite(STATUS_LED_PIN, HIGH);
  Serial.println("\nWiFi Connected");
}

void setupFirebase() {
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

void checkHardwareTriggers() {
  // Listen to /hardware_triggers collection
  // Filtering for status == 'pending'
  String path = "/hardware_triggers";
  
  if (Firebase.Firestore.getDocument(&fbdo, "your-project-id", "", path, "status=pending")) {
    // Parse response and look for actions
    // if action == "UNLOCK_CABINET" -> unlockCabinet();
    // if action == "FIRMWARE_UPDATE" -> performOTA(payload);
  }
}

void unlockCabinet() {
  digitalWrite(SOLENOID_PIN, HIGH);
  delay(5000); // Hold for 5 seconds
  digitalWrite(SOLENOID_PIN, LOW);
}

/**
 * OTA Update Routine
 * Downloads the .bin file from the provided URL and applies it.
 */
void performOTA(String url) {
  Serial.println("Starting OTA Update...");
  HTTPClient http;
  http.begin(url);
  int httpCode = http.GET();

  if (httpCode == HTTP_CODE_OK) {
    int contentLength = http.getSize();
    bool canBegin = Update.begin(contentLength);

    if (canBegin) {
      WiFiClient *client = http.getStreamPtr();
      size_t written = Update.writeStream(*client);

      if (written == contentLength) {
        if (Update.end()) {
          Serial.println("OTA Success! Rebooting...");
          ESP.restart();
        }
      }
    }
  }
  http.end();
}

void sendHeartbeat() {
  // Update /cabinet_status/main_cabinet with current WiFi, doorState, and pegStates
}
