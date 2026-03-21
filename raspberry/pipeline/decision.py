"""
Decision layer: maps detection + trigger context to SortCommand(s).

Pure functions / small class — easy to unit test without hardware.
"""

from __future__ import annotations

from typing import List

from .types import DetectionResult, SortCommand, TriggerEvent, TriggerReason


# Minimum confidence before trusting a routing decision
DEFAULT_CONFIDENCE_FLOOR = 0.45


class SortingDecisionEngine:
    def __init__(self, confidence_floor: float = DEFAULT_CONFIDENCE_FLOOR):
        self.confidence_floor = confidence_floor

    def decide(self, trigger: TriggerEvent, detection: DetectionResult) -> List[SortCommand]:
        out: List[SortCommand] = []

        if trigger.reason in (TriggerReason.FILL_THRESHOLD, TriggerReason.WEIGHT_THRESHOLD):
            out.append(SortCommand.BIN_FULL_ALERT)
            return out

        if trigger.reason in (TriggerReason.WASTE_DEPOSITED, TriggerReason.MANUAL):
            route = self._route_from_label(detection)
            return [route] if route != SortCommand.NO_ACTION else [SortCommand.NO_ACTION]

        return [SortCommand.NO_ACTION]

    def _route_from_label(self, d: DetectionResult) -> SortCommand:
        if not d.frame_ok or d.error:
            return SortCommand.REJECT_OR_UNSORTED
        if d.confidence < self.confidence_floor:
            return SortCommand.REJECT_OR_UNSORTED

        label = (d.label or "").strip().lower()

        if label in ("plastic", "pet", "hdpe"):
            return SortCommand.ROUTE_PLASTIC
        if label in ("metal", "can", "aluminum", "steel"):
            return SortCommand.ROUTE_METAL
        if label in ("organic", "food", "biodegradable", "compost"):
            return SortCommand.ROUTE_ORGANIC
        if label in ("paper", "cardboard", "recyclable"):
            return SortCommand.ROUTE_RECYCLABLE
        if label in ("unknown", "other", ""):
            return SortCommand.REJECT_OR_UNSORTED

        return SortCommand.ROUTE_GENERAL
