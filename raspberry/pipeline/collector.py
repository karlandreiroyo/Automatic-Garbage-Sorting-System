"""
Collector layer: produces TriggerEvent when bin logic says "run detection".

Simulation today:
  - Random deposits (object_present) and gradual fill/weight drift.
  - Triggers when object is deposited, or fill/weight crosses a threshold.

Arduino later (same interface):
  Replace SimulatedBinCollector with a class that reads sensor bytes over serial,
  e.g. fill from ultrasonic (cm → normalized), weight from load cell ADC,
  waste_present from IR break-beam. Parse one line per tick: "F:0.62,W:1.2,O:1\\n"
  and build BinState + emit TriggerEvent on rising edge of O or threshold breach.

Keep this module free of OpenCV/YOLO so it stays easy to test on a PC without a GPU.
"""

from __future__ import annotations

import random
import time
from dataclasses import replace
from typing import Callable, Optional

from .types import BinState, TriggerEvent, TriggerReason


class SimulatedBinCollector:
    """
    Tick-based simulator: call tick() each main-loop iteration.
    Returns a TriggerEvent at most once per triggering condition per cycle.
    """

    def __init__(
        self,
        fill_trigger: float = 0.92,
        weight_trigger_kg: float = 8.0,
        deposit_probability_per_tick: float = 0.08,
        tick_seconds: float = 0.2,
        rng: Optional[random.Random] = None,
    ):
        self.fill_trigger = fill_trigger
        self.weight_trigger_kg = weight_trigger_kg
        self.deposit_probability_per_tick = deposit_probability_per_tick
        self.tick_seconds = tick_seconds
        self._rng = rng or random.Random()
        self._state = BinState(fill_level=0.25, weight_kg=2.0, object_present=False)
        self._prev_object = False
        self._fill_alert_sent = False
        self._weight_alert_sent = False

    @property
    def state(self) -> BinState:
        return self._state

    def _drift_state(self) -> None:
        s = self._state
        # Slow creep upward; occasional small drops (simulated emptying not modeled).
        fill_delta = self._rng.uniform(-0.01, 0.03)
        weight_delta = self._rng.uniform(-0.05, 0.15)
        new_fill = max(0.0, min(1.0, s.fill_level + fill_delta))
        new_weight = max(0.0, s.weight_kg + weight_delta)
        present = s.object_present
        if not present and self._rng.random() < self.deposit_probability_per_tick:
            present = True
        elif present and self._rng.random() < 0.15:
            present = False
        self._state = replace(s, fill_level=new_fill, weight_kg=new_weight, object_present=present)

    def tick(self) -> Optional[TriggerEvent]:
        """
        Advance simulation; return a trigger if the pipeline should run detection.
        Priority: fill/weight alerts (operational), then new deposit (ML path).
        """
        self._drift_state()
        now = time.monotonic()
        s = self._state

        if s.fill_level >= self.fill_trigger and not self._fill_alert_sent:
            self._fill_alert_sent = True
            return TriggerEvent(reason=TriggerReason.FILL_THRESHOLD, state=replace(s), timestamp=now)

        if s.weight_kg >= self.weight_trigger_kg and not self._weight_alert_sent:
            self._weight_alert_sent = True
            return TriggerEvent(reason=TriggerReason.WEIGHT_THRESHOLD, state=replace(s), timestamp=now)

        # Rising edge: object just appeared → typical "something was thrown in" trigger
        deposited = s.object_present and not self._prev_object
        self._prev_object = s.object_present
        if deposited:
            return TriggerEvent(reason=TriggerReason.WASTE_DEPOSITED, state=replace(s), timestamp=now)

        return None

    def reset_alerts(self) -> None:
        """Call after operator empties bin (simulation helper)."""
        self._fill_alert_sent = False
        self._weight_alert_sent = False


class CallbackCollector:
    """
    Adapter for hardware: you supply a function that returns Optional[TriggerEvent].
    Useful for Arduino: read serial non-blocking, parse, return trigger or None.
    """

    def __init__(self, poll: Callable[[], Optional[TriggerEvent]]):
        self._poll = poll

    def tick(self) -> Optional[TriggerEvent]:
        return self._poll()
