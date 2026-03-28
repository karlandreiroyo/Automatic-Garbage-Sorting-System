"""
NutriBin desktop ML app stub — merge these lines into your real DesktopApp if needed.
"""
import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env")


class DesktopApp:
    def __init__(self):
        self.ws_url = os.getenv("WS_URL", "ws://localhost:3001")
