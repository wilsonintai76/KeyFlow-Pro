#ifndef LOCAL_SERVER_H
#define LOCAL_SERVER_H

#include <WebServer.h>
#include <ESPmDNS.h>
#include <LittleFS.h>
#include <ArduinoJson.h>
#include "hardware_handler.h"
#include "dashboard_ui.h"
#include "storage_handler.h"


namespace LocalServer {
  WebServer server(80);
  const char* hostname = "keymaster";
  String currentToken = "";
  unsigned long tokenExpiry = 0;
  String lastUser = "Unknown";
  bool isStarted = false;


  void sendCORS(WebServer* srv, int code, const char* type, const String& content) {
    srv->sendHeader("Access-Control-Allow-Origin", "*");
    srv->sendHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    srv->sendHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    srv->send(code, type, content);
  }

  void handleStatus(WebServer* srv) {
    StaticJsonDocument<200> doc;
    doc["status"] = "active";
    doc["doorOpen"] = Hardware::isDoorOpen();
    doc["locked"] = Hardware::isLocked();
    doc["keyPresent"] = Hardware::isKeyPresent();
    doc["offlineMode"] = true;
    
    String response;
    serializeJson(doc, response);
    sendCORS(srv, 200, "application/json", response);
  }

  void handleLogin(WebServer* srv) {
    if (srv->hasArg("plain") == false) {
      sendCORS(srv, 400, "application/json", "{\"error\":\"Body missing\"}");
      return;
    }

    StaticJsonDocument<240> doc;
    deserializeJson(doc, srv->arg("plain"));
    const char* staffId = doc["staffId"];
    const char* pin = doc["pin"];

    if (!staffId || !pin) {
      sendCORS(srv, 400, "application/json", "{\"error\":\"Invalid credentials\"}");
      return;
    }

    String usersJson = Storage::loadUsers();
    DynamicJsonDocument usersDoc(4096);
    DeserializationError error = deserializeJson(usersDoc, usersJson);

    if (error) {
      sendCORS(srv, 500, "application/json", "{\"error\":\"User database corrupted\"}");
      return;
    }

    bool found = false;
    JsonArray users = usersDoc.as<JsonArray>();
    for (JsonObject u : users) {
      if (String(u["staffId"]) == String(staffId) && String(u["pin"]) == String(pin)) {
        found = true;
        lastUser = String(staffId);
        break;
      }
    }


    if (found) {
      currentToken = String(millis()) + String(staffId);
      tokenExpiry = millis() + 60000; 
      String res = "{\"status\":\"success\",\"token\":\"" + currentToken + "\"}";
      sendCORS(srv, 200, "application/json", res);
    } else {
      sendCORS(srv, 401, "application/json", "{\"error\":\"Invalid Staff ID/PIN\"}");
    }
  }

  void handleSync(WebServer* srv) {
    if (srv->hasArg("plain") == false) {
      sendCORS(srv, 400, "application/json", "{\"error\":\"Body missing\"}");
      return;
    }
    
    if (Storage::saveUsers(srv->arg("plain"))) {
      sendCORS(srv, 200, "application/json", "{\"status\":\"success\"}");
    } else {
      sendCORS(srv, 500, "application/json", "{\"error\":\"Write failed\"}");
    }
  }


  void handleUnlock(WebServer* srv) {
    String auth = srv->header("Authorization");
    if (auth != currentToken || millis() > tokenExpiry) {
      sendCORS(srv, 401, "application/json", "{\"error\":\"Unauthorized\"}");
      return;
    }
    Hardware::unlockCabinet();
    
    // Log offline transaction if we aren't talking to Firebase right now
    // (Firebase handler has its own logging for online mode)
    Storage::appendLog("UNLOCK", lastUser);

    sendCORS(srv, 200, "application/json", "{\"status\":\"success\"}");

    currentToken = "";
    tokenExpiry = 0;
  }

  void handleOptions(WebServer* srv) {
    srv->sendHeader("Access-Control-Allow-Origin", "*");
    srv->sendHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    srv->sendHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    srv->send(204);
  }

  void handleDashboard(WebServer* srv) {
    srv->send_P(200, "text/html", DASHBOARD_HTML);
  }

  // Define routes on ANY web server (WiFiManager or Standalone)
  void setupRoutes(WebServer* srv) {
    srv->on("/dashboard", HTTP_GET, [srv]() { handleDashboard(srv); });
    srv->on("/status", HTTP_GET, [srv]() { handleStatus(srv); });

    srv->on("/login", HTTP_POST, [srv]() { handleLogin(srv); });
    srv->on("/sync", HTTP_POST, [srv]() { handleSync(srv); });
    srv->on("/unlock", HTTP_POST, [srv]() { handleUnlock(srv); });
    
    srv->on("/login", HTTP_OPTIONS, [srv]() { handleOptions(srv); });
    srv->on("/sync", HTTP_OPTIONS, [srv]() { handleOptions(srv); });
    srv->on("/unlock", HTTP_OPTIONS, [srv]() { handleOptions(srv); });
    srv->on("/status", HTTP_OPTIONS, [srv]() { handleOptions(srv); });

    const char* headerkeys[] = {"Authorization", "Content-Type"};
    srv->collectHeaders(headerkeys, 2);
  }

  void startStandalone() {
    if (isStarted) return;
    if (MDNS.begin(hostname)) {
      MDNS.addService("http", "tcp", 80);
    }
    setupRoutes(&server);
    server.begin();
    isStarted = true;
    Serial.println("Local Server Started on Station IP.");
  }

  void handle() {
    if (isStarted) {
      server.handleClient();
    }
  }
}

#endif
