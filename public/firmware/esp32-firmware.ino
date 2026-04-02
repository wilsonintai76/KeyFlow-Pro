/**
 * KeyFlow Pro ESP32 Firmware v1.1.0-hardware
 * ---------------------------------------
 * Hardware Logic:
 * 1. Listen for 'commands/cabinet' -> unlockRequested
 * 2. Trigger Relay (GPIO 26) to retract solenoid
 * 3. Monitor Door Sensor (GPIO 27)
 * 4. Monitor 10 Key Slots (GPIO 4, 5, 12-19)
 */

#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <addons/TokenHelper.h>
#include <HTTPUpdate.h>
#include <WiFiClientSecure.h>

/* 1. Configuration */
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"
#define API_KEY "AIzaSyCswJI0IgkkVsVbQcqOmsmkBVGzxSdfsnA"
#define PROJECT_ID "keyflow-pro"

/* 2. Hardware Pin Definitions */
const int RELAY_PIN = 26; 
const int DOOR_PIN = 27;
const int PEG_PINS[] = {4, 5, 12, 13, 14, 15, 16, 17, 18, 19};
const int PEG_COUNT = 10;

/* 3. Global State */
FirebaseData fbdo;
FirebaseData fbdo_stream;
FirebaseAuth auth;
FirebaseConfig config;

bool lastDoorState = false;
bool lastPegStates[PEG_COUNT];
String currentRequesterId = "";
String currentRequesterName = "Unknown";
unsigned long lastHeartbeatUpdate = 0;
const unsigned long HEARTBEAT_INTERVAL = 30000; // 30 seconds

void setup() {
  Serial.begin(115200);

  // Pin Modes
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW); // Solenoid Locked
  pinMode(DOOR_PIN, INPUT_PULLUP);
  
  for(int i=0; i < PEG_COUNT; i++) {
    pinMode(PEG_PINS[i], INPUT_PULLUP);
    lastPegStates[i] = (digitalRead(PEG_PINS[i]) == LOW);
  }

  // WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.println("\nWiFi Connected");

  // Firebase
  config.api_key = API_KEY;
  auth.user.email = "wilsonintai76@gmail.com";
  auth.user.password = "ESP32_SECURE_PASS"; // Ensure this matches your Firebase Auth

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  // Start listening for commands
  if (!Firebase.Firestore.beginStream(&fbdo_stream, PROJECT_ID, "", "commands/cabinet")) {
    Serial.println("Stream Begin Error: " + fbdo_stream.errorReason());
  }
}

void loop() {
  if (Firebase.ready()) {
    handleCommands();
    monitorDoor();
    monitorKeys();
    handleHeartbeat();
  }
}

void handleHeartbeat() {
  if (millis() - lastHeartbeatUpdate > HEARTBEAT_INTERVAL) {
    lastHeartbeatUpdate = millis();
    Serial.println("Sending Heartbeat...");
    
    FirebaseJson content;
    content.set("fields/lastHeartbeat/stringValue", "2026-04-02T16:50:00Z"); // In real use, ESP32 would get NTP time
    content.set("fields/status/stringValue", "online");
    
    Firebase.Firestore.patchDocument(&fbdo, PROJECT_ID, "", "cabinet_status/main", content.raw(), "lastHeartbeat,status");
  }
}

void handleCommands() {
  if (Firebase.Firestore.readStream(&fbdo_stream)) {
    if (fbdo_stream.errorReason() == "") {
      // Check for unlockRequested in the command document
      FirebaseJson &json = fbdo_stream.jsonObject();
      FirebaseJsonData result;
      
      json.get(result, "fields/unlockRequested/booleanValue");
      if (result.success && result.boolValue) {
        // Capture User Info for the log
        json.get(result, "fields/requestedBy/stringValue");
        currentRequesterId = result.stringValue;
        json.get(result, "fields/requestedByName/stringValue");
        currentRequesterName = result.stringValue;

        unlockCabinet();
      }

      // Check for OTA Update URL
      json.get(result, "fields/otaUrl/stringValue");
      if (result.success && result.stringValue != "") {
        String url = result.stringValue;
        Serial.println("OTA Update Triggered! URL: " + url);
        
        // Clear the URL in Firestore so it doesn't loop
        FirebaseJson clearOta;
        clearOta.set("fields/otaUrl/stringValue", "");
        Firebase.Firestore.patchDocument(&fbdo, PROJECT_ID, "", "commands/cabinet", clearOta.raw(), "otaUrl");
        
        performOTA(url);
      }
    }
  }
}

void performOTA(String url) {
  WiFiClientSecure client;
  client.setInsecure(); // For Firebase Hosting, though ideally you'd use the root CA fingerprint
  
  Serial.println("Starting OTA Update...");
  t_httpUpdate_return ret = httpUpdate.update(client, url);

  switch (ret) {
    case HTTP_UPDATE_FAILED:
      Serial.printf("OTA Update Failed (Error %d): %s\n", httpUpdate.getLastError(), httpUpdate.getLastErrorString().c_str());
      break;
    case HTTP_UPDATE_NO_UPDATES:
      Serial.println("OTA Update: No updates found.");
      break;
    case HTTP_UPDATE_OK:
      Serial.println("OTA Update Successful! Rebooting...");
      break;
  }
}

void unlockCabinet() {
  Serial.println("Unlocking Cabinet for: " + currentRequesterName);
  digitalWrite(RELAY_PIN, HIGH); // Retract Solenoid
  
  // Clear the trigger in Firestore so it doesn't fire again
  FirebaseJson content;
  content.set("fields/unlockRequested/booleanValue", false);
  Firebase.Firestore.patchDocument(&fbdo, PROJECT_ID, "", "commands/cabinet", content.raw(), "unlockRequested");

  delay(5000); // Keep open for 5 seconds
  digitalWrite(RELAY_PIN, LOW); // Extend Solenoid
  Serial.println("Cabinet Re-locked");
}

void monitorDoor() {
  bool currentState = (digitalRead(DOOR_PIN) == LOW); // LOW means closed if wired normally
  if (currentState != lastDoorState) {
    lastDoorState = currentState;
    Serial.print("Door is now: ");
    Serial.println(currentState ? "CLOSED" : "OPEN");

    FirebaseJson content;
    content.set("fields/doorOpen/booleanValue", !currentState);
    content.set("fields/lastActivity/stringValue", "TIMESTAMP_TOKEN"); // Placeholder for server time if possible, or ISO string
    if (!currentState) {
       content.set("fields/lastUserName/stringValue", currentRequesterName);
       content.set("fields/lastUser/stringValue", currentRequesterId);
    }
    
    Firebase.Firestore.patchDocument(&fbdo, PROJECT_ID, "", "cabinet_status/main", content.raw(), "doorOpen,lastActivity,lastUserName,lastUser");
  }
}

void monitorKeys() {
  for (int i = 0; i < PEG_COUNT; i++) {
    bool isPresent = (digitalRead(PEG_PINS[i]) == LOW);
    if (isPresent != lastPegStates[i]) {
      lastPegStates[i] = isPresent;
      updateKeyStatus(i, isPresent);
    }
  }
}

void updateKeyStatus(int slotIndex, bool isPresent) {
  // Assuming Key IDs are "key_1", "key_2", etc.
  String keyId = "key_" + String(slotIndex + 1);
  Serial.println("Key " + keyId + " is now " + (isPresent ? "AVAILABLE" : "REMOVED"));

  FirebaseJson content;
  content.set("fields/currentStatus/stringValue", isPresent ? "available" : "checked_out");
  if (!isPresent) {
    content.set("fields/lastAssignedToUserId/stringValue", currentRequesterId);
    content.set("fields/lastAssignedToName/stringValue", currentRequesterName);
  }

  Firebase.Firestore.patchDocument(&fbdo, PROJECT_ID, "", "keys/" + keyId, content.raw(), "currentStatus,lastAssignedToUserId,lastAssignedToName");
}
