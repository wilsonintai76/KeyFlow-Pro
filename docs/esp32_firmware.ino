
/**
 * KeyFlow Pro - ESP32 Firmware
 * 
 * Hardware Setup:
 * - Solenoid Relay: Pin 5 (Output)
 * - Microswitch (Door Sensor): Pin 18 (Input Pullup)
 * - Expansion Board: Supported via standard GPIO mapping
 * 
 * Requirements:
 * - Arduino IDE
 * - Library: Firebase ESP Client (by Mobizt)
 */

#include <WiFi.h>
#include <Firebase_ESP_Client.h>

// WiFi Credentials
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// Firebase Config (Get these from your firebase/config.ts)
#define API_KEY "AIzaSyATIeGTX_Y9K5DEvgv1EHfZ4OdU8NQv_N8"
#define FIREBASE_PROJECT_ID "studio-3599802628-88927"

// Hardware Pins
const int SOLENOID_PIN = 5;
const int SENSOR_PIN = 18;

// Firebase objects
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

unsigned long sendDataPrevMillis = 0;
bool doorStateOpen = false;

void setup() {
  Serial.begin(115200);
  
  pinMode(SOLENOID_PIN, OUTPUT);
  pinMode(SENSOR_PIN, INPUT_PULLUP);
  digitalWrite(SOLENOID_PIN, LOW);

  // Connect to WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(300);
  }
  Serial.println("\nConnected to WiFi");

  // Firebase Init
  config.api_key = API_KEY;
  config.database_url = ""; // Not used for Firestore
  
  // Use anonymous auth or specific hardware user
  auth.user.email = ""; 
  auth.user.password = "";

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

void loop() {
  if (Firebase.ready()) {
    
    // 1. Heartbeat & Status Update (Every 30 seconds)
    if (millis() - sendDataPrevMillis > 30000 || sendDataPrevMillis == 0) {
      sendDataPrevMillis = millis();
      
      bool currentDoorState = digitalRead(SENSOR_PIN) == HIGH; // HIGH = Open (Pullup)
      int rssi = WiFi.RSSI();
      int wifiQuality = map(rssi, -100, -40, 0, 100);

      FirebaseJson content;
      content.set("fields/doorState/stringValue", currentDoorState ? "open" : "closed");
      content.set("fields/lastHeartbeat/stringValue", "2024-03-20T12:00:00Z"); // Use NTP for real time
      content.set("fields/wifiSignal/integerValue", String(wifiQuality));

      if (Firebase.Firestore.patchDocument(&fbdo, FIREBASE_PROJECT_ID, "", "cabinet_status/main_cabinet", content.raw(), "doorState,lastHeartbeat,wifiSignal")) {
        Serial.println("Status updated");
      }
    }

    // 2. Listen for Unlock Triggers
    // In a real production environment, you would use a Firestore Stream/Listen
    // For this prototype, we check for 'pending' documents
    String path = "hardware_triggers";
    if (Firebase.Firestore.listDocuments(&fbdo, FIREBASE_PROJECT_ID, "", path, "", 1, "", "", false)) {
      FirebaseJson &json = fbdo.to<FirebaseJson>();
      // Parse logic for 'pending' action...
      // If found:
      // digitalWrite(SOLENOID_PIN, HIGH);
      // delay(2000);
      // digitalWrite(SOLENOID_PIN, LOW);
      // Update doc status to 'processed'
    }
  }
}
