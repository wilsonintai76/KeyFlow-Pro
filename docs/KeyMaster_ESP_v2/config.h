#ifndef CONFIG_H
#define CONFIG_H

/* 1. Network: Captive Portal Configuration */
#define AP_NAME "KeyMaster_Setup"
#define PORTAL_TIMEOUT 180  // Seconds (3 minutes) before automatic closing

/* 2. Firebase Configuration */
#define API_KEY "AIzaSyDlHVttSl9_kpg0oSnb2H06GmO1tFUXlEk"
#define DATABASE_URL "https://keymaster-pro-182e7-default-rtdb.firebaseio.com"

/* 3. Hardware Pin Definitions */
const int SOLENOID_PIN = 26;    // Relay for the cabinet lock
const int DOOR_PIN = 27;        // Door micro-switch (NC/GND)
const int KEY_MASTER_PIN = 25;  // Key slot micro-switch
const int PEG_PINS[] = {4, 5, 12, 13, 14, 15, 16, 17, 18, 19};

#endif
