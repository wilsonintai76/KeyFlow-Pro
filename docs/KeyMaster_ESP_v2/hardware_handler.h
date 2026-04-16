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

  void testFeedback() {
    Serial.println("Running Hardware Diagnostic Test...");

    // Test Status LED (D2)
    digitalWrite(STATUS_LED_PIN, HIGH);
    delay(200);
    digitalWrite(STATUS_LED_PIN, LOW);

    // Test Buzzer (D12)
    digitalWrite(BUZZER_PIN, HIGH);
    delay(100);
    digitalWrite(BUZZER_PIN, LOW);
    delay(100);
    digitalWrite(BUZZER_PIN, HIGH);
    delay(100);
    digitalWrite(BUZZER_PIN, LOW);

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

  void unlockCabinet(unsigned int delayMs = 3000) {
    Serial.println("Unlocking cabinet...");
    digitalWrite(SOLENOID_PIN, HIGH);
    
    // RGB Feedback: Green while unlocked
    pixel.setPixelColor(0, pixel.Color(0, 255, 0));
    pixel.show();

    delay(delayMs);
    
    digitalWrite(SOLENOID_PIN, LOW);
    pixel.clear();
    pixel.show();
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
