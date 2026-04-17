#ifndef FIREBASE_HANDLER_H
#define FIREBASE_HANDLER_H

#include <Firebase_ESP_Client.h>
#include "config.h"
#include "hardware_handler.h"

namespace FirebaseService {
  FirebaseData fbdo;
  FirebaseData fbdo_stream;
  FirebaseAuth auth;
  FirebaseConfig config;
  
  // Cache for dashboard compatibility
  String lastUserName = "None";
  
  // Decoupling Flags: Used to trigger hardware actions outside of the Firebase context
  bool pendingUnlock = false;
  String pendingUser = "";
  
  void init() {
    config.api_key = API_KEY;
    config.database_url = DATABASE_URL;

    // 1. Wait for NTP Time Sync (Required for Firebase SSL)
    Serial.println("Waiting for Time Sync...");
    unsigned long time_start = millis();
    while (time(nullptr) < 1000000000l && millis() - time_start < 10000) {
      delay(500);
      Serial.print(".");
    }
    time_t now = time(nullptr);
    Serial.printf("\nCurrent time: %s", ctime(&now));

    // 2. Initialize Firebase
    Firebase.begin(&config, &auth);
    Firebase.reconnectWiFi(true);

    // 2. Wait for WiFi and sign in anonymously
    Serial.println("Connecting to Firebase...");
    unsigned long start = millis();
    bool signedIn = false;
    
    // Retry sign-in for up to 30 seconds
    while (millis() - start < 30000) {
      Serial.println("Attempting anonymous sign-in...");
      if (Firebase.signUp(&config, &auth, "", "")) {
        signedIn = true;
        Serial.println("Anonymous Sign-in Successful.");
        break;
      } else {
        Serial.printf("Sign-up Failed: %s. Status code: %d. Retrying...\n", 
                      config.signer.signupError.message.c_str(),
                      fbdo.httpCode());
      }
      delay(3000);
    }

    if (!signedIn) {
      Serial.println("\nFailed to sign in anonymously. System will retry in background.");
    }
    
    Serial.println("Firebase Service Initialized.");
    
    // 3. Begin RTDB Stream Listener
    if (!Firebase.RTDB.beginStream(&fbdo_stream, "/live/cabinet_unlock")) {
      Serial.println("Stream Begin Error: " + fbdo_stream.errorReason());
    }
  }

  void handleUnlockStream() {
    if (!Firebase.RTDB.readStream(&fbdo_stream)) {
      Serial.println("Stream Read Error: " + fbdo_stream.errorReason());
      return;
    }

    if (fbdo_stream.streamAvailable()) {
      if (fbdo_stream.dataType() == "json") {
        FirebaseJson& json = fbdo_stream.jsonObject();
        FirebaseJsonData data;
        
        // Capture user name for dashboard status
        if (json.get(data, "userName")) {
          lastUserName = data.stringValue;
        }

        if (json.get(data, "action") && data.stringValue == "UNLOCK") {
          Serial.println("Unlock requested from Firebase for: " + lastUserName);
          pendingUnlock = true;
          pendingUser = lastUserName;
        }
      }
    }
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
    FirebaseJson status;
    status.set("doorOpen", Hardware::isDoorOpen());
    status.set("doorState", Hardware::isDoorOpen() ? "open" : "locked");
    status.set("locked", Hardware::isLocked());
    status.set("lastUserName", lastUserName);
    status.set("keyInSlot", Hardware::isKeyPresent());
    status.set("wifiSignal", WiFi.RSSI());
    status.set("lastHeartbeat", getTimestamp());
    status.set("firmwareVersion", "2.1.0");

    bool pgStates[10];
    Hardware::getPegStates(pgStates);
    FirebaseJson pegJson;
    for(int i=0; i<10; i++) pegJson.set(String(i), pgStates[i]);
    status.set("pegStates", pegJson);

    if (Firebase.RTDB.setJSON(&fbdo, "/live/cabinet", &status)) {
      Serial.println("Cabinet status reported to RTDB /live/cabinet");
    } else {
      Serial.println("Status report failed: " + fbdo.errorReason());
    }
  }
}

#endif
