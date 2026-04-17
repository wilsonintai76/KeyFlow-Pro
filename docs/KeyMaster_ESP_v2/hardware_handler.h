#ifndef HARDWARE_HANDLER_H
#define HARDWARE_HANDLER_H

#include <Adafruit_NeoPixel.h>
#include "config.h"

namespace Hardware {
  // Initialize RGB LED (1 pixel on RGB_LED_PIN)
  Adafruit_NeoPixel pixel(1, RGB_LED_PIN, NEO_GRB + NEO_KHZ800);

  void init() {
    // 1. Core Hardware initialization
    pinMode(SOLENOID_PIN, OUTPUT);
    digitalWrite(SOLENOID_PIN, LOW);
    
    pinMode(DOOR_PIN, INPUT_PULLUP);
    pinMode(KEY_MASTER_PIN, INPUT_PULLUP);
    for(int i=0; i<10; i++) pinMode(PEG_PINS[i], INPUT_PULLUP);

    // 2. Maker Feather AIoT S3 specific initialization
    pinMode(VPERIPHERAL_PIN, OUTPUT);
    digitalWrite(VPERIPHERAL_PIN, HIGH); // Enable power to Buzzer & Ports
    
    pinMode(STATUS_LED_PIN, OUTPUT);
    digitalWrite(STATUS_LED_PIN, LOW);
    
    pinMode(BUZZER_PIN, OUTPUT);
    digitalWrite(BUZZER_PIN, LOW);

    pixel.begin();
    pixel.setBrightness(50);
    pixel.clear();
    pixel.show();
    
    Serial.println("Hardware initialized (AIoT S3 Mode).");
  }

  unsigned long unlockEndTime = 0;
  bool unlockActive = false;
  unsigned long lastBlinkTime = 0;
  bool blinkState = false;

  void beep(int frequency, int duration) {
    tone(BUZZER_PIN, frequency, duration);
  }

  void testFeedback() {
    Serial.println("Running Hardware Diagnostic Test...");

    // Test Status LED (D2)
    digitalWrite(STATUS_LED_PIN, HIGH);
    delay(200);
    digitalWrite(STATUS_LED_PIN, LOW);

    // Test Buzzer (D12)
    beep(1000, 100);
    delay(150);
    beep(1200, 100);

    // Test RGB LED (D46) - Red, Green, Blue cycle
    pixel.setPixelColor(0, pixel.Color(255, 0, 0)); // Red
    pixel.show();
    delay(500);
    pixel.setPixelColor(0, pixel.Color(0, 255, 0)); // Green
    pixel.show();
    delay(500);
    pixel.setPixelColor(0, pixel.Color(0, 0, 255)); // Blue
    pixel.show();
    delay(500);
    pixel.clear();
    pixel.show();

    Serial.println("Diagnostic Test Complete.");
  }

  void unlockCabinet(unsigned int durationMs = 60000) {
    if (!unlockActive) {
      Serial.println("Unlocking cabinet...");
      
      // Audible Unlock Feedback
      beep(1500, 100); delay(150);
      beep(1500, 100); 

      digitalWrite(SOLENOID_PIN, HIGH);
      digitalWrite(STATUS_LED_PIN, HIGH);

      unlockEndTime = millis() + durationMs;
      unlockActive = true;
      lastBlinkTime = millis();
    }
  }

  void update() {
    if (unlockActive) {
      // 1. Check for relock timeout
      if (millis() >= unlockEndTime) {
        digitalWrite(SOLENOID_PIN, LOW);
        digitalWrite(STATUS_LED_PIN, LOW);
        
        // Audible Lock Feedback
        beep(800, 300);
        
        unlockActive = false;
        Serial.println("Cabinet locked again.");
      } 
      else {
        // 2. Visual Blinking Feedback while unlocked
        if (millis() - lastBlinkTime > 250) {
          lastBlinkTime = millis();
          blinkState = !blinkState;
          digitalWrite(STATUS_LED_PIN, blinkState ? HIGH : LOW);
        }
      }
    }
  }

  bool isLocked() {
    return !unlockActive;
  }

  bool isDoorOpen() {
    // If we are currently in the 1-minute unlock window, report as "Open" 
    // even if the physical sensor isn't connected.
    if (unlockActive) return true;
    return digitalRead(DOOR_PIN) == HIGH; // Original hardware logic
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
