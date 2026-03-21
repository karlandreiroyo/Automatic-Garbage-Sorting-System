"""
Detection layer: frame in → classification label out.

Production path: OpenCV capture + Ultralytics YOLO (optional dependencies).
Prototype path: MockDetector returns a plausible label without a camera.

Install on Pi when ready:
  pip install opencv-python-headless ultralytics

Set YOLO_MODEL to your .pt path; class indices must match your trained model.
"""

from __future__ import annotations

import time
from typing import List, Optional, Protocol

import numpy as np

from .types import DetectionResult


class FrameSource(Protocol):
    def read(self) -> tuple[bool, "np.ndarray"]: ...


class MockCamera:
    """Returns a small blank frame so the stack runs without hardware."""

    def read(self) -> tuple[bool, np.ndarray]:
        return True, np.zeros((480, 640, 3), dtype=np.uint8)


class OpenCVCamera:
    def __init__(self, index: int = 0):
        import cv2

        self._cv2 = cv2
        self._cap = cv2.VideoCapture(index)
        if not self._cap.isOpened():
            raise RuntimeError(f"Could not open camera index {index}")

    def read(self) -> tuple[bool, np.ndarray]:
        return self._cap.read()

    def release(self) -> None:
        self._cap.release()


class Detector(Protocol):
    def detect(self, frame: np.ndarray) -> DetectionResult: ...


class MockDetector:
    """Deterministic-ish fake labels for demos without weights file."""

    _LABELS = ("plastic", "metal", "organic", "paper", "unknown")

    def __init__(self, rng_seed: int = 42):
        import random

        self._rng = random.Random(rng_seed)

    def detect(self, frame: np.ndarray) -> DetectionResult:
        t0 = time.perf_counter()
        label = self._rng.choice(self._LABELS)
        conf = self._rng.uniform(0.55, 0.99)
        elapsed = time.perf_counter() - t0
        return DetectionResult(label=label, confidence=conf, inference_time_s=elapsed, frame_ok=True)


class YoloDetector:
    """
    Wraps Ultralytics YOLO. Maps highest-confidence detection to a string label.
    Override class_names if your model uses different order.
    """

    def __init__(
        self,
        model_path: str,
        class_names: Optional[List[str]] = None,
        conf_threshold: float = 0.35,
        device: Optional[str] = None,
    ):
        from ultralytics import YOLO

        self._model = YOLO(model_path)
        self._class_names = class_names
        self._conf_threshold = conf_threshold
        self._device = device

    def detect(self, frame: np.ndarray) -> DetectionResult:
        t0 = time.perf_counter()
        try:
            kwargs = {"conf": self._conf_threshold, "verbose": False}
            if self._device:
                kwargs["device"] = self._device
            results = self._model.predict(frame, **kwargs)
        except Exception as e:
            return DetectionResult(
                label="unknown",
                confidence=0.0,
                inference_time_s=time.perf_counter() - t0,
                frame_ok=False,
                error=str(e),
            )

        elapsed = time.perf_counter() - t0
        if not results or results[0].boxes is None or len(results[0].boxes) == 0:
            return DetectionResult(
                label="unknown", confidence=0.0, inference_time_s=elapsed, frame_ok=True
            )

        r0 = results[0]
        boxes = r0.boxes
        confs = boxes.conf.cpu().numpy()
        clss = boxes.cls.cpu().numpy().astype(int)
        best_i = int(confs.argmax())
        cls_id = int(clss[best_i])
        conf = float(confs[best_i])
        id_to_name = r0.names or {}
        if self._class_names and 0 <= cls_id < len(self._class_names):
            label = str(self._class_names[cls_id]).lower()
        elif cls_id in id_to_name:
            label = str(id_to_name[cls_id]).lower()
        else:
            label = str(cls_id)
        return DetectionResult(label=label, confidence=conf, inference_time_s=elapsed, frame_ok=True)
