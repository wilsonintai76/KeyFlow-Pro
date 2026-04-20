#ifndef FIREBASE_HANDLER_H
#define FIREBASE_HANDLER_H

#include <Firebase_ESP_Client.h>

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>


#include <sys/time.h>
#include "config.h"
#include "hardware_handler.h"
#include "storage_handler.h"

namespace FirebaseService {
  FirebaseData fbdo;
  FirebaseAuth auth;
  FirebaseConfig config;



  
  void checkMemory() {
    Serial.println("\n[MEMORY DIAGNOSTIC]");
    Serial.printf("Internal Free Heap: %u bytes\n", ESP.getFreeHeap());
    Serial.printf("Internal Min Free:  %u bytes\n", ESP.getMinFreeHeap());
    Serial.printf("Max Alloc Block:    %u bytes\n", ESP.getMaxAllocHeap());
    Serial.printf("PSRAM Size:         %u bytes\n", ESP.getPsramSize());
    Serial.printf("PSRAM Free:         %u bytes\n", ESP.getFreePsram());
    if (ESP.getPsramSize() == 0) {
      Serial.println("WARNING: PSRAM NOT DETECTED! Check IDE Settings (OPI PSRAM).");
    }
    Serial.println("-------------------\n");
  }







  
  // Cache for dashboard compatibility
  String lastUserName = "None";
  
  // Decoupling Flags: Used to trigger hardware actions outside of the Firebase context
  bool pendingUnlock = false;
  String pendingUser = "";
  
  void runConnectivityDiagnostic() {
    Serial.println("\n--- STARTING NETWORK PROBE ---");
    WiFiClient client;
    WiFiClientSecure secureClient;
    secureClient.setInsecure();
    HTTPClient http;

    // Test 1: Plain HTTP (Google)
    Serial.print("[PROBE 1] Testing Plain HTTP (Google Port 80)... ");
    if (http.begin(client, "http://www.google.com")) {
      int code = http.GET();
      Serial.printf("Result: %d\n", code);
      http.end();
    } else Serial.println("Failed to start.");

    // Test 2: Standard HTTPS (Google)
    Serial.print("[PROBE 2] Testing Standard SSL (Google Port 443)... ");
    if (http.begin(secureClient, "https://www.google.com")) {
      int code = http.GET();
      Serial.printf("Result: %d\n", code);
      http.end();
    } else Serial.println("Failed to start.");

    // Test 3: Firebase DNS & Connection
    Serial.println("[PROBE 3] Testing Firebase Reachability...");
    IPAddress remote_ip;
    String host = String(DATABASE_URL);
    host.replace("https://", "");
    host.replace("/", "");
    if (WiFi.hostByName(host.c_str(), remote_ip)) {
      Serial.printf("  DNS Success: %s resolved to %s\n", host.c_str(), remote_ip.toString().c_str());
    } else {
      Serial.printf("  DNS FAILED for %s\n", host.c_str());
    }
    
    Serial.println("--- PROBE COMPLETE ---\n");
  }

  void init() {
    checkMemory();
    
    // --- DNS OVERRIDE (Bypass Hotspot Block) ---
    // Your hotspot is resolving Firebase to 0.0.0.0. 
    // We force the chip to use Google DNS (8.8.8.8) instead.
    IPAddress dns(8, 8, 8, 8);
    IPAddress dns2(8, 8, 4, 4);
    WiFi.config(INADDR_NONE, INADDR_NONE, INADDR_NONE, dns, dns2);
    
    runConnectivityDiagnostic();

    
    config.api_key = API_KEY;
    config.database_url = DATABASE_URL;
    config.signer.tokens.legacy_token = FIREBASE_AUTH;
    config.cert.data = NULL; // Explicitly set insecure mode for internal client

    // --- Hardened Internal SSL ---
    fbdo.setResponseSize(1024);
    fbdo.setBSSLBufferSize(4096, 1024); // Lean but stable buffers for PSRAM 
    fbdo.keepAlive(0, 0, 0); 

    Serial.println("Initialising Firebase (Hardened Mode)...");
    Firebase.begin(&config, &auth);
    Firebase.reconnectWiFi(true);

    Serial.println("Firebase Service Initialized.");
  }







  void handleUnlockStream() {
    // Stream disabled for memory stability.
    // Cloud-to-Cabinet unlocks will be handled via status polling or Local Server.
  }




  String getTimestamp() {
    time_t now = time(nullptr);
    struct tm timeinfo;
    gmtime_r(&now, &timeinfo); // Use UTC for standardization
    char buf[25];
    strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
    return String(buf);
  }

  void reportStatus() {
    checkMemory();
    
    // 1. Create the Payload
    JsonDocument doc;
    doc["doorOpen"] = Hardware::isDoorOpen();
    doc["doorState"] = Hardware::isDoorOpen() ? "open" : "locked";
    doc["locked"] = Hardware::isLocked();
    doc["lastUserName"] = lastUserName;
    doc["keyInSlot"] = Hardware::isKeyPresent();
    doc["wifiSignal"] = WiFi.RSSI();
    doc["lastHeartbeat"] = getTimestamp();
    doc["firmwareVersion"] = "2.2.0-NATIVE";

    bool pgStates[10];
    Hardware::getPegStates(pgStates);
    JsonArray pegArray = doc["pegStates"].to<JsonArray>();
    for(int i=0; i<10; i++) pegArray.add(pgStates[i]);

    String payload;
    serializeJson(doc, payload);

    // 2. Native REST Bypass (Core 3.0 Stability + Firewall Bypass)
    WiFiClientSecure secureClient;
    secureClient.setInsecure(); // Skip certificate verification
    
    // Diagnostic: Check DNS resolution again right before the call
    IPAddress ip;
    String host = String(DATABASE_URL);
    host.replace("https://", "");
    host.replace("/", "");
    if (WiFi.hostByName(host.c_str(), ip)) {
      Serial.printf("[NATIVE] DNS OK: %s -> %s\n", host.c_str(), ip.toString().c_str());
    } else {
      Serial.println("[NATIVE] DNS FAILED!");
    }

    HTTPClient http;
    // We now point to your own website BRIDGE to bypass the hotspot's Firebase block
    String fullUrl = "https://keymaster-pro-182e7.web.app/api/status"; 
    
    Serial.println("[BRIDGE] v3.0 - Sending status to Web Portal...");
    if (http.begin(secureClient, fullUrl)) {
      http.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
      http.addHeader("Content-Type", "application/json");
      http.addHeader("Connection", "close");
      
      int httpCode = http.PUT(payload); 
      if (httpCode > 0) {
        Serial.printf("[BRIDGE] Success! HTTP Code: %d\n", httpCode);
      } else {
        Serial.printf("[BRIDGE] Failed. Error: %s\n", http.errorToString(httpCode).c_str());
      }
      http.end();
    } else {
      Serial.println("[BRIDGE] Unable to reach web portal.");
    }



  }


  void printStatus() {
    Serial.printf("Free Heap: %u bytes\n", ESP.getFreeHeap());
    if (!Firebase.ready()) {
      Serial.print("Firebase NOT READY. Error: ");
      Serial.println(fbdo.errorReason().length() > 0 ? fbdo.errorReason() : "Wait/Auth-Issues");
    }
  }


  void syncOfflineLogs() {
    if (!Firebase.ready()) return;

    String logsJson = Storage::getLogs();
    if (logsJson == "[]" || logsJson == "") return;

    Serial.println("Offline Logs Found. Attempting Cloud Sync...");

    DynamicJsonDocument doc(4096);
    DeserializationError error = deserializeJson(doc, logsJson);
    if (error) {
      Serial.println("Error parsing offline logs for sync.");
      return;
    }

    JsonArray logs = doc.as<JsonArray>();
    bool allSuccess = true;

    for (JsonObject log : logs) {
      // Add current server-side timestamp to the offline log
      log["syncTime"] = getTimestamp();
      log["status"] = "SYNCED";

      // Convert ArduinoJson object to String, then to FirebaseJson
      String serialized;
      serializeJson(log, serialized);
      FirebaseJson fjson;
      fjson.setJsonData(serialized);

      if (Firebase.RTDB.pushJSON(&fbdo, "/log", &fjson)) {
        Serial.println("Offline log synced successfully.");
      } else {
        Serial.println("Log sync failed: " + fbdo.errorReason());
        allSuccess = false;
        break; 
      }
    }


    if (allSuccess) {
      Serial.println("All offline logs synchronized. Clearing local buffer.");
      Storage::clearLogs();
    }
  }
}



#endif
