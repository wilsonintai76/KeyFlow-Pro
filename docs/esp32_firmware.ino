
/**
 * KeyFlow Pro | ESP32 Cabinet Firmware
 * Handles Solenoid Triggering and Peg Microswitch Detection
 */

#include <WiFi.h>
#include <Firebase_ESP_Client.h> // Ensure "Firebase Arduino Client Library for ESP8266 and ESP32" is installed

// --- CONFIGURATION ---
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* API_KEY = "AIzaSyATIeGTX_Y9K5DEvgv1EHfZ4OdU8NQv_N8";
const char* FIREBASE_PROJECT_ID = "studio-3599802628-88927";

// --- PIN DEFINITIONS ---
const int SOLENOID_PIN = 23;    // Relay/Solenoid output
const int DOOR_SWITCH_PIN = 22; // Cabinet door microswitch
const int PEG_PINS[] = {4, 5, 18, 19, 21}; // Array of microswitch pins for key pegs
const int PEG_COUNT = 5;

// --- FIREBASE OBJECTS ---
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

void setup() {
  Serial.begin(115200);
  
  // Pin Setup
  pinMode(SOLENOID_PIN, OUTPUT);
  digitalWrite(SOLENOID_PIN, LOW);
  pinMode(DOOR_SWITCH_PIN, INPUT_PULLUP);
  for(int i=0; i<PEG_COUNT; i++) {
    pinMode(PEG_PINS[i], INPUT_PULLUP);
  }

  // WiFi Connection
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("WiFi Connected");

  // Firebase Init
  config.api_key = API_KEY;
  config.database_url = ""; // Not used for Firestore
  auth.user.email = "wilsonintai76@gmail.com"; // Use the master admin account for hardware
  auth.user.password = "master_secret_password"; // Set this in Firebase Console for this account

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

unsigned long lastUpdate = 0;
const long updateInterval = 5000; // Report status every 5 seconds

void loop() {
  if (Firebase.ready()) {
    // 1. LISTEN FOR TRIGGER (Listen to /hardware_triggers collection)
    // For simplicity in a loop, we poll or use Firestore Listeners.
    // Logic: If a doc exists with status "pending", trigger solenoid and update status to "processed".

    // 2. REPORT CABINET STATUS
    if (millis() - lastUpdate > updateInterval) {
      reportStatus();
      lastUpdate = millis();
    }
  }
}

void reportStatus() {
  FirebaseJson content;
  bool doorOpen = digitalRead(DOOR_SWITCH_PIN) == LOW; // Assuming LOW means open
  
  content.set("fields/doorState/stringValue", doorOpen ? "open" : "closed");
  content.set("fields/wifiSignal/integerValue", WiFi.RSSI());
  
  // Create Peg States Map
  FirebaseJson pegMap;
  for(int i=0; i<PEG_COUNT; i++) {
    bool present = digitalRead(PEG_PINS[i]) == LOW; // Assuming LOW means key is IN
    pegMap.set(String(i), present);
  }
  
  // Firestore REST API Format for Objects/Maps is complex, 
  // Simplified here for logical structure.
  
  String documentPath = "databases/(default)/documents/cabinet_status/main_cabinet";
  if (Firebase.Firestore.patchDocument(&fbdo, FIREBASE_PROJECT_ID, "", documentPath.c_str(), content.raw(), "doorState,wifiSignal")) {
    Serial.println("Status Updated");
  }
}
