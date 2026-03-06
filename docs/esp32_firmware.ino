/**
 * KeyFlow Pro - ESP32 Cabinet Firmware
 * 
 * Hardware Requirements:
 * - ESP32 DevKit V1
 * - Solenoid Lock (controlled via relay or MOSFET)
 * - Door Microswitch (magnetic or physical)
 * - Key Peg Microswitches (connected to GPIOs or Shift Register)
 * 
 * Dependencies:
 * - Firebase ESP32 Client (by Mobizt)
 */

#include <WiFi.h>
#include <Firebase_ESP_Client.h>

// --- Configuration ---
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"
#define API_KEY "AIzaSyATIeGTX_Y9K5DEvgv1EHfZ4OdU8NQv_N8"
#define FIREBASE_PROJECT_ID "studio-3599802628-88927"

// --- Hardware Pins ---
#define PIN_SOLENOID 18
#define PIN_DOOR_SWITCH 19
const int PEG_PINS[] = {4, 5, 12, 13, 14, 15, 25, 26, 27, 32}; // 10 Pegs
#define NUM_PEGS 10

// --- Firebase Objects ---
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

unsigned long lastHeartbeat = 0;
const long heartbeatInterval = 10000; // 10 seconds

void setup() {
	Serial.begin(115200);
	
	// Pin Setup
	pinMode(PIN_SOLENOID, OUTPUT);
	digitalWrite(PIN_SOLENOID, LOW);
	pinMode(PIN_DOOR_SWITCH, INPUT_PULLUP);
	for(int i=0; i<NUM_PEGS; i++) {
		pinMode(PEG_PINS[i], INPUT_PULLUP);
	}

	// WiFi Connection
	WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
	while (WiFi.status() != WL_CONNECTED) {
		delay(500);
		Serial.print(".");
	}
	Serial.println("\nWiFi Connected");

	// Firebase Setup
	config.api_key = API_KEY;
	config.database_url = ""; // Not used for Firestore
	
	// Anonymous Sign-in for Hardware
	if (Firebase.ready()) {
		Serial.println("Firebase Ready");
	}
	
	Firebase.begin(&config, &auth);
}

void loop() {
	if (Firebase.ready()) {
		// 1. Listen for Hardware Triggers (Unlock Command)
		listenForTriggers();

		// 2. Report Status (Heartbeat and Pegs)
		if (millis() - lastHeartbeat > heartbeatInterval) {
			reportCabinetStatus();
			lastHeartbeat = millis();
		}
	}
}

void listenForTriggers() {
	String path = "hardware_triggers";
	// Note: In a production environment, use a Stream listener.
	// This is a simplified polling logic for the template.
	if (Firebase.Firestore.getDocument(&fbdo, FIREBASE_PROJECT_ID, "", path, "")) {
		// Logic to parse the "pending" triggers and fire the solenoid
	}
}

void triggerUnlock() {
	Serial.println("Unlocking Cabinet...");
	digitalWrite(PIN_SOLENOID, HIGH);
	delay(3000); // 3 seconds unlock time
	digitalWrite(PIN_SOLENOID, LOW);
}

void reportCabinetStatus() {
	FirebaseJson content;
	
	// Door State
	bool doorOpen = digitalRead(PIN_DOOR_SWITCH) == LOW; // Assuming NC switch
	content.set("fields/doorState/stringValue", doorOpen ? "open" : "closed");
	
	// Timestamp
	content.set("fields/lastHeartbeat/stringValue", "2024-03-20T10:00:00Z"); // Use NTP for real time
	
	// WiFi Signal
	content.set("fields/wifiSignal/integerValue", String(WiFi.RSSI()));

	// Peg States (Microswitches)
	FirebaseJson pegMap;
	for(int i=0; i<NUM_PEGS; i++) {
		bool keyIn = digitalRead(PEG_PINS[i]) == LOW;
		pegMap.set(String(i), keyIn);
	}
	content.set("fields/pegStates/mapValue/fields", pegMap);

	String docPath = "cabinet_status/main_cabinet";
	if (Firebase.Firestore.patchDocument(&fbdo, FIREBASE_PROJECT_ID, "", docPath, content.raw(), "doorState,lastHeartbeat,wifiSignal,pegStates")) {
		Serial.println("Status Reported");
	}
}
