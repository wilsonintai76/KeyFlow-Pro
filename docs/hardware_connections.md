# KeyMaster Pro: Hardware Connection Guide (ESP32)

This document provides the pinout and wiring instructions for the KeyMaster Pro cabinet hardware.

## ESP32 Pin Assignment

| Component | GPIO Pin | Mode | Wiring Instruction |
| :--- | :--- | :--- | :--- |
| **Cabinet Lock (Relay)** | **26** | OUTPUT | Connect to Relay Module `IN/SIG`. Use external power for solenoid. |
| **Door Micro Switch** | **27** | INPUT_PULLUP | COM to Pin 27, NC/NO to GND. Detects if door is physically open/closed. |
| **Key Slot Master Switch**| **25** | INPUT_PULLUP | COM to Pin 25, NC/NO to GND. General key presence detection. |
| **Key Peg 01 - 10** | **4, 5, 12-19**| INPUT_PULLUP| Individual detection for each key slot. |

## Wiring Diagram Notes

### 1. Solenoid / Relay
> [!WARNING]
> Do NOT power the solenoid directly from the ESP32 5V/3V3 pins. Use an external 12V power supply and a Flyback Diode across the solenoid terminals to prevent back-EMF damage to the ESP32.

### 2. Micro Endswitches
The firmware uses internal pull-up resistors. Wiring to **GND** and the **NC (Normally Closed)** terminal is recommended so that a cut wire triggers an "Open" or "Warning" state for security.

## Alignment with Software
- **Live Node**: `/live/cabinet_unlock` (Firmware listens here for UNLOCK signals).
- **Status Node**: `/live/status` (Firmware reports door/key state here).
- **Log Node**: `/log` (Firmware pushes timestamped event logs here).
