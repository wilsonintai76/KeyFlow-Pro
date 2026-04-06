# 🔑 KeyMaster Pro

**KeyMaster Pro** is a high-performance, real-time cabinet management system built with **Next.js 15**, **Firebase**, and **ESP32** hardware. Designed for sub-second latency and low-cost deployment on the **Firebase Spark Plan**.

## 🚀 Key Features

- **⚡ Real-time Control**: Uses Firebase Realtime Database (RTDB) for instantaneous cabinet unlocking and sensor reports.
- **🔐 Professional Auth**: Integrated **Google SSO** with a secure **First-User Admin** bootstrap system. 
- **📈 Advanced Auditing**: Live system activity tracking stored in a high-efficiency `/log` node.
- **📡 Smart Hardware**: Modular ESP32 firmware with a **WiFi Captive Portal** for easy network setup without hardcoding credentials.

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), Tailwind CSS, Lucide Icons, Shadcn UI.
- **Backend**: Firebase App Hosting, Firebase Auth (Google), Firebase Firestore, Firebase Realtime Database.
- **Hardware**: ESP32 (Arduino framework), WiFiManager, Firebase-ESP-Client.

## 🗼 Hardware Connections (ESP32)

| Component | GPIO Pin | Mode | Note |
| :--- | :--- | :--- | :--- |
| **Cabinet Lock** | **26** | OUTPUT | Signal to Relay / Solenoid |
| **Door Switch** | **27** | INPUT | Micro-switch (Open/Closed) |
| **Key Master** | **25** | INPUT | Key Presence Detection |
| **Key Pegs** | **4, 5, 12-19** | INPUT | 10 Individual Key Slots |

## 📶 WiFi Setup Instructions

1. Power on the ESP32 hardware.
2. Connect to the WiFi hotspot named **`KeyMaster_Setup`**.
3. Select your local WiFi network and enter the password in the portal.
4. The ESP32 will automatically save the credentials and connect to the cloud.

> [!TIP]
> To reset WiFi settings, hold down the **Key Slot Switch (Pin 25)** while powering on the device.

## 📦 Getting Started

### Web Application
1. Install dependencies: `npm install`
2. Deploy to Firebase: `firebase deploy`

### Firmware
1. Open `docs/KeyMaster_ESP_v2/KeyMaster_ESP_v2.ino` in Arduino IDE.
2. Install `WiFiManager` and `Firebase-ESP-Client` libraries.
3. Flash the code to your ESP32 board.

## 📄 License

Internal use for **KeyMaster Pro** project.
