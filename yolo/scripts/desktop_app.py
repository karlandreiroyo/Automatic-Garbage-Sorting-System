"""
NutriBin desktop ML app stub — merge these lines into your real DesktopApp if needed.
"""
import os
from pathlib import Path

from dotenv import load_dotenv


class DesktopApp:
    def __init__(self):
        load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env")
        self.ws_url = os.getenv("WS_URL", "ws://localhost:3001")
