#define FIREBASE_USE_PSRAM
#include <WiFiManager.h>

#include <LittleFS.h>
#include <ArduinoJson.h>
#include "config.h"
#include "hardware_handler.h"
#include "firebase_handler.h"
#include "local_server.h"

unsigned long lastHeartbeat = 0;
const long heartbeatInterval = 3000; // 3 seconds
unsigned long lastConnectionCheck = 0;
const long checkInterval = 10000; // Check every 10s

// Declare WiFiManager globally
WiFiManager wm;
bool didSyncLogs = false;


// Callback for WiFiManager to register our custom routes on its internal server during AP mode
void bindServerCallback() {
  Serial.println("WiFiManager WebServer started. Binding local routes...");
  LocalServer::setupRoutes(wm.server.get());
}

void setup() {
  Serial.begin(115200);
  Serial.println("\n--- KeyMaster Pro - ESP32 Firmware v2.2.0 ---");

  // 0. Initialize File System
  if (!LittleFS.begin(true, "/littlefs", 10, "spiffs")) {
    Serial.println("LittleFS Mount Failed");
  } else {
    Serial.println("LittleFS Mounted Successfully");
  }

  // 1. Initialize Hardware Components
  Hardware::init();
  Hardware::testFeedback(); 

  // 2. WiFi Setup with Captive Portal
  wm.setWebServerCallback(bindServerCallback);
  WiFi.mode(WIFI_AP_STA); 

  wm.setConfigPortalTimeout(PORTAL_TIMEOUT);
  wm.setConfigPortalBlocking(false); // Non-blocking!
  
  const char* OFFLINE_AP_NAME = "KeyMaster_Offline";

  // Add Custom Button to WiFiManager Menu
  std::vector<const char *> menu = {"wifi", "info", "custom", "sep", "update", "exit"};
  wm.setMenu(menu);
  wm.setCustomMenuHTML("<form action='/dashboard' method='get'><button style='outline:none;border:none;background:#144b89;color:white;font-weight:bold;width:100%;padding:10px;border-radius:4px;cursor:pointer'> CABINET ACCESS </button></form>");

  // Manual Reset Trigger
  if (Hardware::isKeyPresent()) {
    Serial.println("Reset Button Detected: Clearing WiFi Settings...");
    wm.resetSettings();
  }

  // Attempt to connect (Non-blocking)
  wm.autoConnect(OFFLINE_AP_NAME);
  
  // 3. Initialize Firebase Service
  FirebaseService::init();

  Serial.println("Startup complete. Awaiting connection...");
}


void resetWiFiAndReboot() {
  wm.resetSettings();
  ESP.restart();
}

void loop() {
  // Always handle non-blocking hardware tasks
  Hardware::update();

  // 1. Handle WiFiManager & Local HTTP Client Requests
  wm.process();
  LocalServer::handle();

  // Smart Visibility Monitor: Toggle AP mode based on connectivity
  if (millis() - lastConnectionCheck > checkInterval) {
    lastConnectionCheck = millis();
    
    if (WiFi.status() == WL_CONNECTED) {
      if (WiFi.getMode() == WIFI_AP_STA && !wm.getConfigPortalActive()) {
        Serial.println("Stable Connection: Hiding Hotspot.");
        WiFi.mode(WIFI_STA);
      }
    } else {
      // If disconnected and not already in AP_STA mode, start hotspot fallback
      if (WiFi.getMode() != WIFI_AP_STA) {
        Serial.println("Connection Lost: Starting Emergency Hotspot...");
        WiFi.mode(WIFI_AP_STA);
      }
    }

  }


  // 3. Handle Cloud (Firebase) sync if connected
  if (Firebase.ready()) {
    // Handle Cloud Unlock Requests
    FirebaseService::handleUnlockStream();
    if (FirebaseService::pendingUnlock) {
      Hardware::unlockCabinet();
      FirebaseService::pendingUnlock = false;
      
      FirebaseJson resetJson;
      resetJson.set("action", "IDLE");
      Firebase.RTDB.setJSON(&FirebaseService::fbdo, "/live/cabinet_unlock", &resetJson);
    }

    // Periodic Status Heartbeat
    if (millis() - lastHeartbeat > heartbeatInterval || lastHeartbeat == 0) {
      lastHeartbeat = millis();
      FirebaseService::reportStatus();
    }

    // NEW: Sync offline logs as soon as we regain connection
    if (!didSyncLogs) {
      FirebaseService::syncOfflineLogs();
      didSyncLogs = true;
    }
  } else {
    didSyncLogs = false; // Reset so we retry whenever connection returns
    
    // Periodic Diagnostic: Print error if not connected (every 30s)

    static unsigned long lastErrorLog = 0;
    if (millis() - lastErrorLog > 30000) {
      lastErrorLog = millis();
      FirebaseService::printStatus();
    }
  }

}
