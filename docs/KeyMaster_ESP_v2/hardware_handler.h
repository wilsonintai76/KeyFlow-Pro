#ifndef HARDWARE_HANDLER_H
#define HARDWARE_HANDLER_H

#include <Arduino.h>
#include "config.h"

namespace Hardware {
  void init() {
    pinMode(SOLENOID_PIN, OUTPUT);
    digitalWrite(SOLENOID_PIN, LOW);
    
    pinMode(DOOR_PIN, INPUT_PULLUP);
    pinMode(KEY_MASTER_PIN, INPUT_PULLUP);
    for(int i=0; i<10; i++) pinMode(PEG_PINS[i], INPUT_PULLUP);
    
    Serial.println("Hardware initialized.");
  }

  void unlockCabinet(unsigned int delayMs = 3000) {
    Serial.println("Unlocking cabinet...");
    digitalWrite(SOLENOID_PIN, HIGH);
    delay(delayMs);
    digitalWrite(SOLENOID_PIN, LOW);
    Serial.println("Cabinet locked again.");
  }

  bool isDoorOpen() {
    return digitalRead(DOOR_PIN) == HIGH;
  }

  bool isKeyPresent() {
    return digitalRead(KEY_MASTER_PIN) == LOW;
  }

  void getPegStates(bool* states) {
    for(int i=0; i<10; i++) {
      states[i] = (digitalRead(PEG_PINS[i]) == LOW);
    }
  }
}

#endif
