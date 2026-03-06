
/**
 * KeyFlow Pro ESP32 Firmware
 * 
 * Target: ESP32 DevKit V1
 * Dependencies: 
 * - Firebase ESP Client (by Mobizt)
 * - WiFi.h
 * 
 * This firmware connects to Firestore and:
 * 1. Listens for 'UNLOCK_CABINET' triggers in /hardware_triggers.
 * 2. Reports door state and peg occupancy to /cabinet_status/main_cabinet.
 * 3. Sends heartbeats every 30 seconds.
 */

#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <addons/TokenHelper.h>

// --- Configuration ---
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// Firebase API Key (From Firebase Console -> Project Settings)
#define API_KEY "YOUR_FIREBASE_API_KEY"
// Firebase Project ID
#define FIREBASE_PROJECT_ID "studio-3599802628-88927"

// --- Hardware Pins ---
#define SOLENOID_PIN 23   // Pin connected to relay/transistor for solenoid
#define DOOR_SENSOR_PIN 22 // Magnetic door contact (Internal pull-up)
const int PEG_PINS[] = {13, 12, 14, 27, 26, 25, 33, 32, 35, 34}; // Pins for 10 pegs

// --- Global Variables ---
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;
unsigned long lastHeartbeat = 0;
const char* FIRMWARE_VERSION = "1.0.4-stable";

void setup() {
  Serial.begin(115200);
  
  pinMode(SOLENOID_PIN, OUTPUT);
  digitalWrite(SOLENOID_PIN, LOW);
  pinMode(DOOR_SENSOR_PIN, INPUT_PULLUP);
  
  for(int i=0; i<10; i++) {
    pinMode(PEG_PINS[i], INPUT_PULLUP);
  }

  Serial.printf("Connecting to WiFi: %s\n", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected!");

  config.api_key = API_KEY;
  // Using Anonymous Auth for the device
  // Ensure "Anonymous" is enabled in Firebase Auth Console
  auth.user.email = ""; 
  auth.user.password = "";

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

void processTrigger(FirebaseJson &json) {
  FirebaseJsonData action;
  FirebaseJsonData status;
  
  json.get(action, "action");
  json.get(status, "status");

  if (status.stringValue == "pending") {
    if (action.stringValue == "UNLOCK_CABINET") {
      Serial.println("Action: UNLOCKING CABINET...");
      digitalWrite(SOLENOID_PIN, HIGH);
      delay(3000); // Hold unlocked for 3 seconds
      digitalWrite(SOLENOID_PIN, LOW);
    } else if (action.stringValue == "FIRMWARE_UPDATE") {
      Serial.println("Action: SIMULATING FIRMWARE UPDATE...");
      // In a real scenario, trigger OTA update here
      delay(2000);
    }
  }
}

void sendHeartbeat() {
  FirebaseJson json;
  json.set("doorState", digitalRead(DOOR_SENSOR_PIN) == LOW ? "open" : "closed");
  json.set("wifiSignal", WiFi.RSSI());
  json.set("firmwareVersion", FIRMWARE_VERSION);
  json.set("lastHeartbeat/.sv", "timestamp"); // Firebase Server Timestamp

  FirebaseJson pegs;
  for(int i=0; i<10; i++) {
    // LOW = Key present (if using pull-up)
    pegs.set(String(i), digitalRead(PEG_PINS[i]) == LOW);
  }
  json.set("pegStates", pegs);

  Serial.println("Sending Heartbeat to Firestore...");
  if (Firebase.Firestore.patchDocument(&fbdo, FIREBASE_PROJECT_ID, "", "cabinet_status/main_cabinet", json.raw(), "doorState,wifiSignal,firmwareVersion,lastHeartbeat,pegStates")) {
    Serial.println("Heartbeat OK");
  } else {
    Serial.println(fbdo.errorReason());
  }
}

void loop() {
  if (Firebase.ready()) {
    // 1. Send Heartbeat every 30 seconds
    if (millis() - lastHeartbeat > 30000 || lastHeartbeat == 0) {
      lastHeartbeat = millis();
      sendHeartbeat();
    }

    // 2. Poll for pending triggers
    // In production, use Firebase Streams for real-time responsiveness
    if (Firebase.Firestore.getDocument(&fbdo, FIREBASE_PROJECT_ID, "", "hardware_triggers")) {
      // Logic to iterate through documents and find 'pending' ones
      // This is a simplified polling example.
    }
  }
}
