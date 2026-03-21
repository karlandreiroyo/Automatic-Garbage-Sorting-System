from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Optional


class TriggerReason(Enum):
    """Why the pipeline ran a detection cycle."""

    WASTE_DEPOSITED = "waste_deposited"
    FILL_THRESHOLD = "fill_threshold"
    WEIGHT_THRESHOLD = "weight_threshold"
    MANUAL = "manual"


@dataclass
class BinState:
    """Snapshot of bin sensors (real or simulated)."""

    fill_level: float  # 0.0 .. 1.0
    weight_kg: float
    object_present: bool


@dataclass
class TriggerEvent:
    """One collector firing: run detection and downstream logic."""

    reason: TriggerReason
    state: BinState
    timestamp: float


@dataclass
class DetectionResult:
    """Output of the detection layer (YOLO or mock)."""

    label: str
    confidence: float
    inference_time_s: float
    frame_ok: bool = True
    error: Optional[str] = None


class SortCommand(Enum):
    """High-level actuator intent (printed for now; later: GPIO / serial)."""

    ROUTE_PLASTIC = "route_plastic"
    ROUTE_METAL = "route_metal"
    ROUTE_ORGANIC = "route_organic"
    ROUTE_RECYCLABLE = "route_recyclable"
    ROUTE_GENERAL = "route_general"
    REJECT_OR_UNSORTED = "reject_or_unsorted"
    BIN_FULL_ALERT = "bin_full_alert"
    NO_ACTION = "no_action"
