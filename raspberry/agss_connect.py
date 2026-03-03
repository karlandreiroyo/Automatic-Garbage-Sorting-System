"""
Send ML classification results to the Automatic Garbage Sorting System backend.
Use this from your LearningMachine / NutriBin-MachineLearning inference script to connect to the app.

Usage:
  Set API_URL (env or .env): http://YOUR_LAPTOP_IP:3001  or your Railway backend URL.
  In your inference script:
    import sys
    sys.path.insert(0, '..')  # or path to raspberry folder
    from agss_connect import send_to_backend

    # after your model predicts:
    send_to_backend("Biodegradable", processing_time_seconds=1.2)
"""

import os
import sys

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

API_URL = os.environ.get("API_URL", "http://127.0.0.1:3001").rstrip("/")
DEVICE_ID = os.environ.get("DEVICE_ID", "raspberry-pi-1")


def send_to_backend(category, processing_time_seconds=0):
    """
    Send one classification result to the AGSS backend.
    category: "Biodegradable" | "Non-Biodegradable" | "Recyclable" | "Unsorted"
    processing_time_seconds: optional, e.g. inference time in seconds.
    Returns True if sent successfully, False otherwise.
    """
    try:
        import requests
    except ImportError:
        print("AGSS connect: pip install requests", file=sys.stderr)
        return False

    url = f"{API_URL}/api/device/sensor"
    body = {
        "category": category,
        "processing_time": processing_time_seconds,
        "device_id": DEVICE_ID,
    }
    try:
        r = requests.post(url, json=body, headers={"Content-Type": "application/json"}, timeout=10)
        if r.ok:
            print("AGSS: sent to backend:", category)
            return True
        print("AGSS: backend error", r.status_code, r.text, file=sys.stderr)
        return False
    except Exception as e:
        print("AGSS: send failed", e, file=sys.stderr)
        return False
