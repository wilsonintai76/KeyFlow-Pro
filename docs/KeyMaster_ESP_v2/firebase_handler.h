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
  
  void init() {
    config.api_key = API_KEY;
    config.database_url = DATABASE_URL;

    // 1. Initialize Firebase
    Firebase.begin(&config, &auth);
    Firebase.reconnectWiFi(true);

    // 2. Perform Anonymous Login to satisfy 'auth != null' rules
    Serial.println("Signing in anonymously...");
    if (Firebase.ready()) {
      if (!Firebase.signUp(&config, &auth, "", "")) {
        Serial.printf("Anonymous Sign-up Failed: %s\n", config.signer.signupError.message.c_str());
      } else {
        Serial.println("Anonymous Sign-in Successful.");
      }
    }
    
    Serial.println("Firebase Service Ready.");
    
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
        json.get(data, "action");
        
        if (data.stringValue == "UNLOCK") {
          Serial.println("Unlock triggered from Firebase!");
          Hardware::unlockCabinet();
          Firebase.RTDB.setJSON(&fbdo, "/live/cabinet_unlock", "{\"action\":\"IDLE\"}");
        }
      }
    }
  }

  void reportStatus() {
    FirebaseJson status;
    status.set("doorOpen", Hardware::isDoorOpen());
    status.set("keyInSlot", Hardware::isKeyPresent());
    status.set("rssi", WiFi.RSSI());
    status.set("lastSeen", String(millis()));

    bool pgStates[10];
    Hardware::getPegStates(pgStates);
    FirebaseJson pegStates;
    for(int i=0; i<10; i++) pegStates.set(String(i), pgStates[i]);
    status.set("pegStates", pegStates);

    if (Firebase.RTDB.setJSON(&fbdo, "/live/status", status.raw())) {
      Serial.println("Hardware status reported to RTDB.");
    } else {
      Serial.println("Status report failed: " + fbdo.errorReason());
    }
  }
}

#endif
