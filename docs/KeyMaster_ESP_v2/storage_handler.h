#ifndef STORAGE_HANDLER_H
#define STORAGE_HANDLER_H

#include <ArduinoJson.h>
#include <LittleFS.h>

namespace Storage {
const char *USERS_FILE = "/users.json";
const char *LOGS_FILE = "/offline_logs.json";

void init() {
  if (!LittleFS.begin(true)) {
    Serial.println("LittleFS Mount Failed in Storage Handler");
  }
}

// --- User Database Management ---

bool saveUsers(const String &json) {
  File file = LittleFS.open(USERS_FILE, "w");
  if (!file)
    return false;
  file.print(json);
  file.close();
  Serial.println("Staff database saved to Flash.");
  return true;
}

String loadUsers() {
  if (!LittleFS.exists(USERS_FILE))
    return "[]";
  File file = LittleFS.open(USERS_FILE, "r");
  if (!file)
    return "[]";
  String data = file.readString();
  file.close();
  return data;
}

// --- Offline Transaction Logging ---

void appendLog(String type, String userId, String data = "{}") {
  JsonDocument doc;
  String currentLogs = "[]";

  if (LittleFS.exists(LOGS_FILE)) {
    File file = LittleFS.open(LOGS_FILE, "r");
    currentLogs = file.readString();
    file.close();
  }

  DeserializationError error = deserializeJson(doc, currentLogs);
  if (error) {
    doc.clear();
    doc.to<JsonArray>();
  }

  JsonArray array = doc.as<JsonArray>();

  // Limit to 50 logs to prevent memory/flash issues
  if (array.size() >= 50) {
    array.remove(0); // Remove oldest
  }

  JsonObject entry = array.add<JsonObject>();
  entry["type"] = type;
  entry["userId"] = userId;
  entry["timestamp"] = "OFFLINE"; // Will be updated by server on sync
  entry["data"] = data;

  File file = LittleFS.open(LOGS_FILE, "w");
  serializeJson(doc, file);
  file.close();

  Serial.printf("Offline log added: %s by %s\n", type.c_str(), userId.c_str());
}

String getLogs() {
  if (!LittleFS.exists(LOGS_FILE))
    return "[]";
  File file = LittleFS.open(LOGS_FILE, "r");
  String data = file.readString();
  file.close();
  return data;
}

void clearLogs() {
  if (LittleFS.exists(LOGS_FILE)) {
    LittleFS.remove(LOGS_FILE);
    Serial.println("Offline logs cleared.");
  }
}
} // namespace Storage

#endif
