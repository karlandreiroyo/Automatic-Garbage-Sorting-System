#!/usr/bin/env python3
"""
Run the Raspberry Pi side of the Automatic Garbage Sorting System.
- Sends a test reading to the backend (quick check).
- Set API_URL in the environment or .env so the Pi can reach your backend.
- Compatible with Raspberry Pi 4B CPU (no GPU required).

Usage (on the Pi):
  cd ~/Automatic-Garbage-Sorting-System/raspberry
  export API_URL=http://YOUR_LAPTOP_IP:3001   # or your Railway backend URL
  python3 run.py

  Or run once and exit:
  python3 run.py --once
"""

import argparse
import sys
import time

# Allow importing agss_connect from this folder
try:
    from agss_connect import send_to_backend
except ImportError:
    print("Error: agss_connect.py not found. Run this script from the raspberry folder.", file=sys.stderr)
    sys.exit(1)


def run_once():
    """Send one test reading to the backend."""
    ok = send_to_backend("Biodegradable", 0)
    return 0 if ok else 1


def run_loop(interval_seconds=10):
    """Send a test reading every interval_seconds (for demo/testing)."""
    print("Sending a reading every", interval_seconds, "seconds. Ctrl+C to stop.")
    while True:
        send_to_backend("Biodegradable", 0)
        time.sleep(interval_seconds)


def main():
    parser = argparse.ArgumentParser(description="Run AGSS Raspberry Pi – send readings to backend")
    parser.add_argument("--once", action="store_true", help="Send one reading and exit")
    parser.add_argument("--interval", type=float, default=10, help="Seconds between readings in loop (default: 10)")
    args = parser.parse_args()

    if args.once:
        sys.exit(run_once())
    run_loop(args.interval)


if __name__ == "__main__":
    main()
