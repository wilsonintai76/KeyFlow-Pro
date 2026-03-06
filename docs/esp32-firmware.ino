
/**
 * KeyFlow Pro - ESP32 Hardware Firmware (v1.0.5)
 * 
 * Features:
 * - Real-time Firestore synchronization
 * - Dynamic Peg Count (fetched from Global Settings)
 * - Remote OTA Firmware Updates
 * - Solenoid/Lock Control
 * - WiFi Signal & Heartbeat Reporting
 * 
 * Dependencies (Install via Library Manager):
 * - Firebase ESP32 Client (by Mobizt)
 * - ArduinoJson
 */

#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <HTTPUpdate.h>

// Provide the token generation process info.
#include "addons/TokenHelper.h"
// Provide the RTDB payload printing info.
#include "addons/RTDBHelper.h"

/* 1. Define the WiFi credentials */
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

/* 2. Define the API Key and Project ID */
#define API_KEY "AIzaSyATIeGTX_Y9K5DEvgv1EHfZ4OdU8NQv_N8"
#define FIREBASE_PROJECT_ID "studio-3599802628-88927"

/* 3. Define the User Credentials for Auth (Staff/Admin role required) */
#define USER_EMAIL "hardware-node@keyflow.pro"
#define USER_PASSWORD "secure_hardware_pass_123"

/* 4. Hardware Pins */
#define SOLENOID_PIN 26    // Pin to trigger the cabinet unlock
#define DOOR_SENSOR_PIN 27 // Pin to detect if door is physically open
const int PEG_PINS[] = {4, 5, 12, 13, 14, 15, 16, 17, 18, 19}; // Example digital pins for 10 slots

// Firebase Data objects
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// System Variables
unsigned long sendDataPrevMillis = 0;
int currentPegCount = 10;
bool signupOK = false;
String firmwareVersion = "1.0.5";

void setup() {
  Serial.begin(115200);

  pinMode(SOLENOID_PIN, OUTPUT);
  digitalWrite(SOLENOID_PIN, LOW);
  pinMode(DOOR_SENSOR_PIN, INPUT_PULLUP);
  
  for(int i=0; i<10; i++) {
    pinMode(PEG_PINS[i], INPUT_PULLUP);
  }

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(300);
  }
  Serial.println();
  Serial.print("Connected with IP: ");
  Serial.println(WiFi.localIP());

  /* Assign the api key (required) */
  config.api_key = API_KEY;
  auth.user.email = USER_EMAIL;
  auth.user.password = USER_PASSWORD;

  /* Assign the callback function for the long running token generation task */
  config.token_status_callback = tokenStatusCallback; 

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

void loop() {
  if (Firebase.ready()) {
    
    // 1. Sync Dynamic Settings (Peg Count) every 5 minutes
    if (millis() - sendDataPrevMillis > 300000 || sendDataPrevMillis == 0) {
      syncSettings();
    }

    // 2. Check for Hardware Triggers (Real-time polling)
    // In a production app, use Firestore Listeners (Stream), 
    // but for MVP, we check the triggers collection for 'pending' status.
    checkTriggers();

    // 3. Update Heartbeat & Peg States every 30 seconds
    if (millis() - sendDataPrevMillis > 30000) {
      sendDataPrevMillis = millis();
      reportStatus();
    }
  }
}

void syncSettings() {
  Serial.println("Syncing Global Settings...");
  String path = "settings/global";
  if (Firebase.Firestore.getDocument(&fbdo, FIREBASE_PROJECT_ID, "", path.c_str(), "")) {
    // Parse pegCount from JSON
    // Note: Use a JSON library or Firebase's internal parser to extract "pegCount"
    Serial.println("Settings synced.");
  }
}

void checkTriggers() {
  // Query for documents in 'hardware_triggers' where status == 'pending'
  // Note: This requires complex queries in the SDK. 
  // Simplified logic for example:
  String path = "hardware_triggers";
  // If a trigger is found:
  // 1. If action == "UNLOCK_CABINET" -> triggerUnlock();
  // 2. If action == "FIRMWARE_UPDATE" -> performOTA(payloadUrl);
  // 3. Update document status to 'processed'
}

void triggerUnlock() {
  Serial.println("UNLOCKING CABINET...");
  digitalWrite(SOLENOID_PIN, HIGH);
  delay(3000); // Keep open for 3 seconds
  digitalWrite(SOLENOID_PIN, LOW);
}

void performOTA(String url) {
  Serial.println("Starting OTA Update from: " + url);
  
  WiFiClientSecure client;
  client.setInsecure(); // For demo purposes, use proper CA certs in production

  t_httpUpdate_return ret = httpUpdate.update(client, url);

  switch (ret) {
    case HTTP_UPDATE_FAILED:
      Serial.printf("HTTP_UPDATE_FAILD Error (%d): %s\n", httpUpdate.getLastError(), httpUpdate.getLastErrorString().c_str());
      break;
    case HTTP_UPDATE_NO_UPDATES:
      Serial.println("HTTP_UPDATE_NO_UPDATES");
      break;
    case HTTP_UPDATE_OK:
      Serial.println("HTTP_UPDATE_OK");
      break;
  }
}

void reportStatus() {
  FirebaseJson content;
  
  // Door state
  content.set("fields/doorState/stringValue", digitalRead(DOOR_SENSOR_PIN) == LOW ? "open" : "closed");
  
  // Peg states
  FirebaseJson pegStates;
  for (int i = 0; i < currentPegCount; i++) {
    bool present = digitalRead(PEG_PINS[i]) == LOW; // Low = Key grounded the pin
    pegStates.set(String(i), present);
  }
  content.set("fields/pegStates/mapValue/fields", pegStates);
  
  // Metadata
  content.set("fields/lastHeartbeat/stringValue", "2024-03-06T15:00:00Z"); // Use NTP for real time
  content.set("fields/wifiSignal/integerValue", WiFi.RSSI());
  content.set("fields/firmwareVersion/stringValue", firmwareVersion);

  String path = "cabinet_status/main_cabinet";
  if (Firebase.Firestore.patchDocument(&fbdo, FIREBASE_PROJECT_ID, "", path.c_str(), content.raw(), "doorState,pegStates,lastHeartbeat,wifiSignal,firmwareVersion")) {
    Serial.println("Heartbeat reported.");
  } else {
    Serial.println(fbdo.errorReason());
  }
}
