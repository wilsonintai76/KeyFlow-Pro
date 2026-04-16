#include <WiFiManager.h>
#include "config.h"
#include "hardware_handler.h"
#include "firebase_handler.h"
#include "local_server.h"

unsigned long lastHeartbeat = 0;
const long heartbeatInterval = 10000; // 10 seconds

void setup() {
  Serial.begin(115200);
  Serial.println("\n--- KeyMaster Pro - ESP32 Firmware v2.1.0 ---");

  // 1. Initialize Hardware Components
  Hardware::init();

  // 2. WiFi Setup with Captive Portal
  WiFiManager wm;
  wm.setConfigPortalTimeout(PORTAL_TIMEOUT);

  // Manual Reset Trigger: If Master Key Pin (D6) is held LOW during boot, reset WiFi.
  if (Hardware::isKeyPresent()) {
    Serial.println("Reset Button Detected: Clearing WiFi Settings...");
    wm.resetSettings();
  }

  if (!wm.autoConnect(AP_NAME)) {
    Serial.println("Failed to connect... forcing restart.");
    delay(3000);
    ESP.restart();
  }
  Serial.println("WiFi Connected Successfully.");

  // 3. Initialize Local Server (Offline Fallback)
  LocalServer::init();

  // 4. Initialize Firebase Services
  FirebaseService::init();
  
  Serial.println("System Ready.");
  Hardware::testFeedback();
}

void loop() {
  // 1. Handle Local HTTP Client Requests
  LocalServer::handle();

  // 2. Handle Cloud (Firebase) sync if connected
  if (Firebase.ready()) {
    // Handle Real-time Stream Triggers (Unlock)
    FirebaseService::handleUnlockStream();

    // Periodic Status Reporting (Heartbeat)
    if (millis() - lastHeartbeat > heartbeatInterval) {
      FirebaseService::reportStatus();
      lastHeartbeat = millis();
    }
  }
}
