#include <WiFiManager.h>
#include "config.h"
#include "hardware_handler.h"
#include "firebase_handler.h"
#include "local_server.h"

unsigned long lastHeartbeat = 0;
const long heartbeatInterval = 3000; // 3 seconds

void setup() {
  Serial.begin(115200);
  Serial.println("\n--- KeyMaster Pro - ESP32 Firmware v2.1.0 ---");

  // 1. Initialize Hardware Components
  Hardware::init();
  Hardware::testFeedback(); // Run test early to avoid Firebase background conflicts

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

  // FORCE WiFi Mode to Station-only after successful connection
  // This turns off the "KeyMaster_Setup" or "ESP32" Access Point/Hotspot.
  WiFi.mode(WIFI_STA); 
  Serial.println("WiFi Connected Successfully.");

  // 3. Sync time for Firebase SSL
  configTime(GMT_OFFSET_SEC, DAYLIGHT_OFFSET_SEC, NTP_SERVER);
  Serial.println("Waiting for NTP time sync...");

  // 4. Initialize Local Server (Offline Fallback)
  LocalServer::init();

  // 5. Initialize Firebase Services
  FirebaseService::init();
  
  Serial.println("System Ready.");
}

void resetWiFiAndReboot() {
  WiFiManager wm;
  wm.resetSettings();
  ESP.restart();
}

void loop() {
  // Handle Non-Blocking Hardware Timers (Unlock, etc)
  Hardware::update();

  // 1. Handle Local HTTP Client Requests
  LocalServer::handle();

  // 2. Handle Cloud (Firebase) sync if connected
  if (Firebase.ready()) {
    // A. Handle Real-time Stream Listeners
    FirebaseService::handleUnlockStream();

    // B. Safe Hardware Trigger: If a Cloud Unlock was requested, process it here
    if (FirebaseService::pendingUnlock) {
      Serial.println("Processing Cloud Unlock for: " + FirebaseService::pendingUser);
      
      // Safety Yield to allow network stack to stabilize
      vTaskDelay(10); 
      Hardware::unlockCabinet();
      vTaskDelay(10);

      // Clear the local flag
      FirebaseService::pendingUnlock = false;

      // Report IDLE status back to Firebase immediately to reset dashboard UI
      FirebaseJson resetJson;
      resetJson.set("action", "IDLE");
      Firebase.RTDB.setJSON(&FirebaseService::fbdo, "/live/cabinet_unlock", &resetJson);
    }

    // C. Periodic Status Reporting (Heartbeat)
    if (millis() - lastHeartbeat > heartbeatInterval || lastHeartbeat == 0) {
      lastHeartbeat = millis();
      FirebaseService::reportStatus();
    }
  }
}
