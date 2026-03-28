"""
WebSocket URL for the ML / YOLO desktop client.

    from ws_url import get_ws_url
    self.ws_url = get_ws_url()

MODE env:
  - local     -> ws://WS_HOST:WS_PORT (defaults localhost:3001)
  - deployed  -> WS_URL or DEPLOYED_WS_URL (wss://... for Railway ML service)

Also loads optional .env next to this file. Falls back to ws://localhost:3001.
"""
from __future__ import annotations

import os
from pathlib import Path

_DEFAULT_LOCAL = "ws://localhost:3001"


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


def _http_to_ws_url(url: str) -> str:
    u = (url or "").strip()
    if not u:
        return u
    if u.startswith("https://"):
        rest = u[8:].split("/")[0]
        return f"wss://{rest}"
    if u.startswith("http://"):
        rest = u[7:].split("/")[0]
        return f"ws://{rest}"
    return u


def get_ws_url() -> str:
    _apply_env_file(Path(__file__).resolve().parent / ".env")
    mode = (os.environ.get("MODE") or "").strip().lower()

    if mode == "local":
        host = (os.environ.get("WS_HOST") or "localhost").strip()
        port = (os.environ.get("WS_PORT") or os.environ.get("LOCAL_WS_PORT") or "3001").strip()
        return f"ws://{host}:{port}"

    if mode == "deployed":
        raw = (os.environ.get("WS_URL") or os.environ.get("DEPLOYED_WS_URL") or "").strip()
        if raw:
            return _http_to_ws_url(raw)
        app = (os.environ.get("NUTRIBIN_APP_URL") or "").strip()
        if app:
            return _http_to_ws_url(app)
        legacy = (os.environ.get("WS_URL") or "").strip()
        return _http_to_ws_url(legacy) if legacy else _DEFAULT_LOCAL

    raw = (os.environ.get("WS_URL") or "").strip()
    if raw:
        return _http_to_ws_url(raw)
    return _DEFAULT_LOCAL
