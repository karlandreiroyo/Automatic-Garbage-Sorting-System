"""
Collector-triggered pipeline: trigger → YOLO detection → decision → actions.

Import from here for integration tests or extensions:
    from pipeline import BinState, TriggerEvent, DetectionResult
"""

from .types import BinState, DetectionResult, SortCommand, TriggerEvent, TriggerReason

__all__ = [
    "BinState",
    "DetectionResult",
    "SortCommand",
    "TriggerEvent",
    "TriggerReason",
]
