#ifndef CONFIG_H
#define CONFIG_H

/* 1. Network: Captive Portal Configuration */
#define AP_NAME "KeyMaster_Setup"
#define PORTAL_TIMEOUT 180  // Seconds (3 minutes) before automatic closing

/* 2. Firebase Configuration */
#define API_KEY "AIzaSyDlHVttSl9_kpg0oSnb2H06GmO1tFUXlEk"
#define DATABASE_URL "https://keymaster-pro-182e7-default-rtdb.firebaseio.com"

/* 3. Hardware Pin Definitions for Maker Feather AIoT S3 */
const int SOLENOID_PIN = 4;     // Solenoid trigger
const int DOOR_PIN = 5;         // Door sensor
const int KEY_MASTER_PIN = 6;   // Master Key Slot
const int PEG_PINS[] = {7, 8, 9, 10, 14, 21, 47, 48, 38, 39};

/* 4. Built-in Maker Features */
const int STATUS_LED_PIN = 2;
#ifndef RGB_LED_PIN
const int RGB_LED_PIN = 46;     // WS2812B RGB LED
#endif
const int BUZZER_PIN = 12;
#define VPERIPHERAL_PIN 11 // Enable peripheral power (Active HIGH)

/* 5. Time Configuration (NTP) */
#define NTP_SERVER "pool.ntp.org"
#define GMT_OFFSET_SEC 28800 // GMT+8 (8 * 3600)
#define DAYLIGHT_OFFSET_SEC 0

#endif
