"""
WebSocket URL for the ML desktop app. Use next to desktop_app.py:

    from ws_url import get_ws_url
    self.ws_url = get_ws_url()

Reads WS_URL from the environment. Loads optional .env in this folder (same
directory as this file) without requiring python-dotenv. Falls back to
ws://localhost:3001 for local development.
"""
from __future__ import annotations

import os
from pathlib import Path

_DEFAULT = "ws://localhost:3001"


def _apply_env_file(path: Path) -> None:
    if not path.is_file():
        return
    try:
        text = path.read_text(encoding="utf-8", errors="ignore")
    except OSError:
        return
    for line in text.splitlines():
        s = line.strip()
        if not s or s.startswith("#"):
            continue
        if "=" not in s:
            continue
        key, _, val = s.partition("=")
        key = key.strip()
        if not key or key in os.environ:
            continue
        val = val.strip().strip('"').strip("'")
        os.environ[key] = val


def get_ws_url() -> str:
    _apply_env_file(Path(__file__).resolve().parent / ".env")
    url = (os.environ.get("WS_URL") or "").strip()
    return url if url else _DEFAULT
