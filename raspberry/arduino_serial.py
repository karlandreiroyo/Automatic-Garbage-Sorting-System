#!/usr/bin/env python3
"""
NutriBin Arduino Serial Communication Module
Handles communication between Raspberry Pi and Arduino for servo control
"""

import os
import serial
import time
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env")

# Serial configuration
ARDUINO_PORT = os.getenv("ARDUINO_PORT", "/dev/ttyUSB0")
BAUD_RATE = 9600
TIMEOUT = 2  # seconds

# Global serial connection
arduino_serial = None

def initialize_serial():
    """Initialize serial connection to Arduino"""
    global arduino_serial
    try:
        arduino_serial = serial.Serial(
            port=ARDUINO_PORT,
            baudrate=BAUD_RATE,
            timeout=TIMEOUT,
            write_timeout=TIMEOUT
        )
        time.sleep(2)  # Allow Arduino to reset
        print(f"[ARDUINO] Connected to {ARDUINO_PORT} at {BAUD_RATE} baud")
        return True
    except serial.SerialException as e:
        print(f"[ARDUINO] Failed to connect to {ARDUINO_PORT}: {e}")
        arduino_serial = None
        return False

def send_to_arduino(category):
    """
    Send sorting command to Arduino

    Args:
        category (str): Garbage category ("biodegradable", "recyclable", "non-recyclable")
    """
    global arduino_serial

    if arduino_serial is None:
        if not initialize_serial():
            print("[ARDUINO] Cannot send command - no serial connection")
            return False

    try:
        # Normalize category name
        category = category.lower().strip()

        # Map YOLO categories to Arduino commands
        category_mapping = {
            "biodegradable": "biodegradable",
            "recyclable": "recyclable",
            "non-recyclable": "non-recyclable",
            "nonrecyclable": "non-recyclable",
            "non bio": "non-recyclable",
            "non-bio": "non-recyclable",
            "bio": "biodegradable",
            "organic": "biodegradable"
        }

        arduino_command = category_mapping.get(category, "non-recyclable")  # Default to non-recyclable

        # Send command
        command_with_newline = f"{arduino_command}\n"
        arduino_serial.write(command_with_newline.encode('utf-8'))
        arduino_serial.flush()

        print(f"[ARDUINO] Sent command: '{arduino_command}' for category: '{category}'")
        return True

    except serial.SerialException as e:
        print(f"[ARDUINO] Serial error: {e}")
        arduino_serial = None  # Reset connection on error
        return False
    except Exception as e:
        print(f"[ARDUINO] Unexpected error: {e}")
        return False

def close_serial():
    """Close serial connection"""
    global arduino_serial
    if arduino_serial and arduino_serial.is_open:
        arduino_serial.close()
        arduino_serial = None
        print("[ARDUINO] Serial connection closed")

# Initialize on import
if __name__ != "__main__":
    initialize_serial()