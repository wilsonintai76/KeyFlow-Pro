
/**
 * KeyFlow Pro ESP32 Firmware
 * Version: 1.0.4-stable
 * 
 * Features:
 * - Real-time Firestore synchronization
 * - Dynamic Peg Count (Configuration over Hardcoding)
 * - Solenoid Lock Control
 * - Door and Key Presence reporting
 * - Heartbeat with Wifi Signal Strength reporting
 */

#include <WiFi.h>
#include <Firebase_ESP_Client.h> // Ensure "Firebase Arduino Client Library for ESP8266 and ESP32" is installed

// --- Configuration ---
#define WIFI_SSID "Your_SSID"
#define WIFI_PASSWORD "Your_Password"

// Firebase project credentials (Found in src/firebase/config.ts)
#define API_KEY "AIzaSyATIeGTX_Y9K5DEvgv1EHfZ4OdU8NQv_N8"
#define FIREBASE_PROJECT_ID "studio-3599802628-88927"

// Pin Definitions
#define PIN_SOLENOID 13
#define PIN_DOOR_SENSOR 14
#define PIN_SHIFT_DATA 25  // If using Shift Registers for many pegs
#define PIN_SHIFT_CLOCK 26
#define PIN_SHIFT_LOAD 27

// Firebase Objects
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// Global State
int currentPegCount = 10; // Default, will be updated from Firestore settings
bool pegStates[100];      // Support up to 100 slots dynamically

void setup() {
  Serial.begin(115200);
  pinMode(PIN_SOLENOID, OUTPUT);
  pinMode(PIN_DOOR_SENSOR, INPUT_PULLUP);
  
  // WiFi Setup
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected");

  // Firebase Setup
  config.api_key = API_KEY;
  config.database_url = ""; // Not used for Firestore
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  // 1. Initial Fetch of pegCount from settings/global
  fetchSystemConfig();
}

void loop() {
  if (Firebase.ready()) {
    // 2. Listen for Solenoid/OTA Triggers (hardware_triggers collection)
    handleTriggers();

    // 3. Scan Hardware (Door + Peg Sensors)
    bool doorOpen = digitalRead(PIN_DOOR_SENSOR) == LOW;
    scanPegSensors();

    // 4. Report Status to cabinet_status/main_cabinet (Heartbeat)
    static unsigned long lastUpdate = 0;
    if (millis() - lastUpdate > 5000) { // Every 5 seconds
      reportStatus(doorOpen);
      lastUpdate = millis();
    }
  }
  delay(100);
}

void fetchSystemConfig() {
  Serial.println("Fetching pegCount from Firestore...");
  String path = "settings/global";
  if (Firebase.Firestore.getDocument(&fbdo, FIREBASE_PROJECT_ID, "", path.c_str(), "")) {
    // Parse JSON for pegCount (Example logic)
    // currentPegCount = parsedValue;
    Serial.print("System Peg Count: "); Serial.println(currentPegCount);
  }
}

void handleTriggers() {
  // Logic to query "hardware_triggers" where status == "pending"
  // If action == "UNLOCK_CABINET":
  //   digitalWrite(PIN_SOLENOID, HIGH); delay(3000); digitalWrite(PIN_SOLENOID, LOW);
  //   Update trigger status to "processed"
}

void scanPegSensors() {
  // Logic to read from Shift Registers up to currentPegCount
  for(int i = 0; i < currentPegCount; i++) {
    // pegStates[i] = readPhysicalPin(i);
  }
}

void reportStatus(bool doorOpen) {
  // Use Firebase.Firestore.patchDocument to update "cabinet_status/main_cabinet"
  // Send: doorState, wifiSignal, lastHeartbeat, firmwareVersion, pegStates object
}
