"""
Optional WebSocket client for sending ML detections to ws-server.py.
Requires: pip install websocket-client

Do not import this from detection code if you already have a working client;
use only for reconnection + standard payload shape.

Example payload (JSON):
  {
    "type": "detection",
    "bin_id": "bin_recycle",
    "category": "plastic_bottle",
    "confidence": 0.87,
    "timestamp": "2026-01-01T12:00:00.000Z"
  }
Optional instead of bin_id: "bin_type": "Recyclable" | "Biodegradable" | "Non-Bio" | "Unsorted"
"""
from __future__ import annotations

import json
import threading
import time
from typing import Any, Callable, Optional


def bin_label_to_ws_bin_id(label: str) -> str:
    s = (label or "").strip().lower()
    if not s:
        return "bin_unsorted"
    if "non" in s and ("bio" in s or "biodegrad" in s):
        return "bin_nonbio"
    if "bio" in s or "biodegrad" in s:
        return "bin_bio"
    if "recycl" in s:
        return "bin_recycle"
    if "unsort" in s:
        return "bin_unsorted"
    return "bin_unsorted"


def build_detection_payload(
    *,
    bin_id: Optional[str] = None,
    bin_type: Optional[str] = None,
    category: str,
    confidence: float,
    timestamp_iso: Optional[str] = None,
) -> dict[str, Any]:
    from datetime import datetime, timezone

    bid = bin_id
    if not bid and bin_type:
        bid = bin_label_to_ws_bin_id(bin_type)
    if not bid:
        bid = "bin_unsorted"
    ts = timestamp_iso or datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    return {
        "type": "detection",
        "bin_id": bid,
        "category": category,
        "confidence": float(confidence),
        "timestamp": ts,
    }


def send_json_reconnecting(
    ws_url: str,
    payload: dict[str, Any],
    *,
    max_attempts: int = 0,
    backoff_start: float = 1.0,
    backoff_max: float = 60.0,
) -> bool:
    """
    Send one JSON message; retry until success if max_attempts==0 (infinite),
    else up to max_attempts times.
    """
    try:
        import websocket
    except ImportError:
        return False

    attempt = 0
    backoff = backoff_start
    while True:
        try:
            ws = websocket.create_connection(ws_url, timeout=10)
            try:
                ws.send(json.dumps(payload))
            finally:
                ws.close()
            return True
        except Exception:
            attempt += 1
            if max_attempts and attempt >= max_attempts:
                return False
            time.sleep(min(backoff, backoff_max))
            backoff = min(backoff * 1.5, backoff_max)


def start_background_sender(
    get_ws_url_fn: Callable[[], str],
    get_payload_fn: Callable[[], Optional[dict[str, Any]]],
    *,
    interval_sec: float = 0.05,
    name: str = "nutribin-ml-ws",
) -> None:
    """
    Poll get_payload_fn(); when non-None, send via reconnecting client (daemon thread).
    Wire get_payload_fn from your queue if detections are async.
    """

    def _run() -> None:
        while True:
            try:
                payload = get_payload_fn()
                if payload:
                    url = get_ws_url_fn()
                    if url:
                        send_json_reconnecting(url, payload)
            except Exception:
                pass
            time.sleep(interval_sec)

    t = threading.Thread(target=_run, name=name, daemon=True)
    t.start()
