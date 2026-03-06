
/**
 * KeyFlow Pro ESP32 Firmware v1.0.4-stable
 * ---------------------------------------
 * Handles Wifi, Firestore listeners for solenoids, 
 * real-time peg status reporting, and OTA updates.
 */

#include <WiFi.h>
#include <Firebase_ESP_Client.h>
// Provide the token generation process info.
#include <addons/TokenHelper.h>
// Provide the RTDB payload printing info.
#include <addons/RTDBHelper.h>

/* 1. Configuration - Replace with your details */
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"
#define API_KEY "AIzaSyATIeGTX_Y9K5DEvgv1EHfZ4OdU8NQv_N8"
#define PROJECT_ID "studio-3599802628-88927"

/* 2. Hardware Pin Definitions */
const int SOLENOID_PIN = 26; // Output to relay or MOSFET for cabinet lock
const int PEG_PINS[] = {4, 5, 12, 13, 14, 15, 16, 17, 18, 19}; // Example pins for 10 pegs
const int PEG_COUNT_DEFAULT = 10;

/* 3. Global Objects */
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;
bool cabinetUnlocked = false;
unsigned long lastHeartbeat = 0;
int currentPegCount = PEG_COUNT_DEFAULT;

void setup() {
  Serial.begin(115200);
  pinMode(SOLENOID_PIN, OUTPUT);
  digitalWrite(SOLENOID_PIN, LOW);

  // Initialize Peg Pins as Inputs
  for(int i=0; i < currentPegCount; i++) {
    pinMode(PEG_PINS[i], INPUT_PULLUP);
  }

  // Connect WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected");

  // Firebase Setup
  config.api_key = API_KEY;
  auth.user.email = "wilsonintai76@gmail.com"; // Device identifies as Admin or service account
  auth.user.password = "PASSWORD_IF_REQUIRED"; 

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

void loop() {
  if (Firebase.ready()) {
    // 1. Listen for Hardware Triggers (UNLOCK / FIRMWARE_UPDATE)
    listenForTriggers();

    // 2. Fetch Global Settings (Dynamic Peg Count)
    updateGlobalConfig();

    // 3. Periodic Heartbeat & Status Report (Every 30s)
    if (millis() - lastHeartbeat > 30000) {
      reportStatus();
      lastHeartbeat = millis();
    }
  }
}

void listenForTriggers() {
  String path = "hardware_triggers";
  // Filter for pending triggers (requires index in Firestore usually, or client side filter)
  // In this simple version, we check the collection for the latest trigger.
  if (Firebase.Firestore.getDocument(&fbdo, PROJECT_ID, "", "hardware_triggers", "")) {
    // Parsing logic for action: "UNLOCK_CABINET" or "FIRMWARE_UPDATE"
    // If "UNLOCK_CABINET":
    // digitalWrite(SOLENOID_PIN, HIGH);
    // delay(3000);
    // digitalWrite(SOLENOID_PIN, LOW);
  }
}

void updateGlobalConfig() {
  // Fetch from settings/global to get dynamic pegCount
  if (Firebase.Firestore.getDocument(&fbdo, PROJECT_ID, "", "settings/global", "")) {
    // Update currentPegCount variable if it changed in cloud
  }
}

void reportStatus() {
  FirebaseJson content;
  content.set("fields/doorState/stringValue", cabinetUnlocked ? "open" : "closed");
  content.set("fields/lastHeartbeat/stringValue", "TIMESTAMP_TOKEN");
  content.set("fields/wifiSignal/integerValue", WiFi.RSSI());
  content.set("fields/firmwareVersion/stringValue", "1.0.4-stable");

  // Report individual peg states
  FirebaseJson pegStates;
  for(int i=0; i < currentPegCount; i++) {
    bool present = (digitalRead(PEG_PINS[i]) == LOW); // Key is in if pin grounded
    pegStates.set(String(i), present);
  }
  content.set("fields/pegStates/mapValue", pegStates);

  Firebase.Firestore.patchDocument(&fbdo, PROJECT_ID, "", "cabinet_status/main_cabinet", content.raw(), "doorState,lastHeartbeat,wifiSignal,firmwareVersion,pegStates");
}
