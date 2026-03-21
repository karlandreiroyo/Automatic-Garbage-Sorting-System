"""
Action layer: today = prints; later = GPIO, serial to Arduino, servos, etc.

Arduino sketch pattern:
  - Pi sends one line: "PLASTIC\\n" / "METAL\\n" / "FULL\\n"
  - Arduino maps to digital pins for flap servos or conveyor direction.
"""

from __future__ import annotations

from typing import Iterable

from .types import SortCommand

_MESSAGES = {
    SortCommand.ROUTE_PLASTIC: "[ACTION] Send to Plastic Bin",
    SortCommand.ROUTE_METAL: "[ACTION] Send to Metal Bin",
    SortCommand.ROUTE_ORGANIC: "[ACTION] Send to Organic Bin",
    SortCommand.ROUTE_RECYCLABLE: "[ACTION] Send to Recyclable Bin",
    SortCommand.ROUTE_GENERAL: "[ACTION] Send to General Waste Bin",
    SortCommand.REJECT_OR_UNSORTED: "[ACTION] Reject / manual inspection (unsorted or low confidence)",
    SortCommand.BIN_FULL_ALERT: "[ACTION] Bin is Full — notify operator / stop intake",
    SortCommand.NO_ACTION: "[ACTION] (no actuator command)",
}


class PrintActionLayer:
    def execute_all(self, commands: Iterable[SortCommand]) -> None:
        for cmd in commands:
            self.execute(cmd)

    def execute(self, command: SortCommand) -> None:
        print(_MESSAGES.get(command, f"[ACTION] Unknown command: {command}"))
