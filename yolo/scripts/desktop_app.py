"""
NutriBin desktop ML app stub — merge these lines into your real DesktopApp if needed.
"""
import os

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))


class DesktopApp:
    def __init__(self):
        self.ws_url = os.getenv("WS_URL", "ws://localhost:3001")
