#ifndef LOCAL_SERVER_H
#define LOCAL_SERVER_H

#include <WebServer.h>
#include <ESPmDNS.h>
#include "hardware_handler.h"

// Forward declaration of the global reset function
extern void resetWiFiAndReboot();

namespace LocalServer {
  WebServer server(80);
  const char* hostname = "keymaster";

  // Helper to send CORS response
  void sendCORS(int code, const char* type, const String& content) {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.sendHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
    server.send(code, type, content);
  }

  void handleRoot() {
    sendCORS(200, "text/plain", "KeyMaster Pro Local Server Active.");
  }

  void handleStatus() {
    String json = "{";
    json += "\"status\":\"active\",";
    json += "\"doorOpen\":" + String(Hardware::isDoorOpen() ? "true" : "false") + ",";
    json += "\"keyPresent\":" + String(Hardware::isKeyPresent() ? "true" : "false");
    json += "}";
    sendCORS(200, "application/json", json);
  }

  void handleUnlock() {
    Serial.println("Local Unlock Request Received.");
    Hardware::unlockCabinet();
    sendCORS(200, "application/json", "{\"status\":\"success\",\"message\":\"Cabinet Unlocked\"}");
  }

  void handleOptions() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.sendHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
    server.send(204);
  }

  void handleResetWiFi() {
    Serial.println("Local WiFi Reset Request Received.");
    sendCORS(200, "application/json", "{\"status\":\"success\",\"message\":\"WiFi Resetting... Device will reboot into Setup Portal.\"}");
    delay(1000);
    
    resetWiFiAndReboot();
  }

  void init() {
    // 1. Initialize mDNS
    if (MDNS.begin(hostname)) {
      Serial.printf("mDNS responder started: http://%s.local\n", hostname);
      MDNS.addService("http", "tcp", 80);
    } else {
      Serial.println("Error setting up MDNS responder!");
    }

    // 2. Setup Routes
    server.on("/", HTTP_GET, handleRoot);
    server.on("/status", HTTP_GET, handleStatus);
    server.on("/unlock", HTTP_GET, handleUnlock);
    server.on("/reset_wifi", HTTP_GET, handleResetWiFi);
    server.on("/unlock", HTTP_OPTIONS, handleOptions); // Handle pre-flight

    server.begin();
    Serial.println("Local HTTP server started on port 80.");
  }

  void handle() {
    server.handleClient();
  }
}

#endif
