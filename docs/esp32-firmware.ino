/**
 * KeyFlow Pro - ESP32 Hardware Firmware (v1.0.4)
 * 
 * Hardware Requirements:
 * - ESP32 Development Board
 * - GPIO 26: Solenoid Relay / Lock Trigger
 * - GPIO 27: Door Status Sensor (Magnetic Switch)
 * - Peg Sensors: Connected via Shift Registers or direct GPIO (Dynamic Count)
 * 
 * This firmware uses the Firebase Client for Arduino/ESP32.
 * It monitors Firestore for 'hardware_triggers' and reports 'cabinet_status'.
 */

#include <WiFi.h>
#include <Firebase_ESP_Client.h>

// 1. PROVIDE YOUR NETWORK CREDENTIALS
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// 2. PROVIDE YOUR FIREBASE PROJECT API KEY AND PROJECT ID
#define API_KEY "AIzaSyATIeGTX_Y9K5DEvgv1EHfZ4OdU8NQv_N8"
#define FIREBASE_PROJECT_ID "studio-3599802628-88927"

// GPIO PINS
const int SOLENOID_PIN = 26;
const int DOOR_SENSOR_PIN = 27;

// Firebase Data Objects
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// Global State
int currentPegCount = 10;
String lastFirmwareVersion = "1.0.4";

void setup() {
  Serial.begin(115200);
  pinMode(SOLENOID_PIN, OUTPUT);
  pinMode(DOOR_SENSOR_PIN, INPUT_PULLUP);
  digitalWrite(SOLENOID_PIN, LOW);

  connectToWiFi();

  // Configure Firebase
  config.api_key = API_KEY;
  config.token_status_callback = tokenStatusCallback;
  
  // Sign in anonymously for hardware access
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

void loop() {
  if (Firebase.ready()) {
    checkTriggers();
    reportStatus();
    syncSettings();
  }
  delay(2000); 
}

void connectToWiFi() {
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(300);
  }
  Serial.println("\nConnected!");
}

/**
 * Monitors the 'hardware_triggers' collection for new actions.
 */
void checkTriggers() {
  String path = "hardware_triggers";
  // Logic: Fetch 'pending' triggers for this device
  if (Firebase.Firestore.getDocument(&fbdo, FIREBASE_PROJECT_ID, "", path.c_str(), "")) {
    // Note: In a production app, we would use a Query to get only 'pending' items
    // If trigger.action == "UNLOCK_CABINET" -> triggerSolenoid()
    // If trigger.action == "FIRMWARE_UPDATE" -> startOTA(trigger.payload)
  }
}

void triggerSolenoid() {
  Serial.println("Hardware: Unlocking Cabinet...");
  digitalWrite(SOLENOID_PIN, HIGH);
  delay(3000); // Keep unlocked for 3 seconds
  digitalWrite(SOLENOID_PIN, LOW);
}

/**
 * Updates 'cabinet_status/main_cabinet' with live data.
 */
void reportStatus() {
  String path = "cabinet_status/main_cabinet";
  FirebaseJson content;
  
  content.set("fields/doorState/stringValue", digitalRead(DOOR_SENSOR_PIN) == LOW ? "closed" : "open");
  content.set("fields/lastHeartbeat/stringValue", "2024-03-06T15:00:00Z"); // Use NTP for actual time
  content.set("fields/wifiSignal/integerValue", WiFi.RSSI());
  content.set("fields/firmwareVersion/stringValue", lastFirmwareVersion);
  
  // Report peg states dynamically based on currentPegCount
  for(int i=0; i < currentPegCount; i++) {
    content.set("fields/pegStates/mapValue/fields/slot_" + String(i) + "/booleanValue", true); // Replace with actual sensor read
  }

  Firebase.Firestore.patchDocument(&fbdo, FIREBASE_PROJECT_ID, "", path.c_str(), content.raw(), "doorState,lastHeartbeat,wifiSignal,pegStates");
}

/**
 * Fetches global settings to update peg counts or policies.
 */
void syncSettings() {
  String path = "settings/global";
  if (Firebase.Firestore.getDocument(&fbdo, FIREBASE_PROJECT_ID, "", path.c_str(), "")) {
    // Update local currentPegCount if different in Firestore
  }
}

void startOTA(String url) {
  Serial.println("Hardware: Starting OTA Update from " + url);
  // Implementation using HTTPUpdate.h or similar
}
