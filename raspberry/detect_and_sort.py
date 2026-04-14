#!/usr/bin/env python3
"""
Collector-triggered prototype: Bin trigger → Webcam frame → YOLO (or mock) → Decision → Print actions.

Run from the raspberry folder:
  python detect_and_sort.py                    # simulation + mock detection
  python detect_and_sort.py --yolo model.pt    # real YOLO + webcam (needs deps)
  python detect_and_sort.py --camera 0         # webcam index (default 0)

Architecture (single process, in-memory):
  CollectorLayer   → emits TriggerEvent when bin rules fire
  DetectionLayer   → grabs one frame, runs YOLO or MockDetector
  DecisionLayer    → SortingDecisionEngine → list[SortCommand]
  ActionLayer      → PrintActionLayer (replace with GPIO/serial later)

Arduino integration later:
  - Implement poll() that reads serial/USB from Arduino with bin sensors.
  - Return TriggerEvent from CallbackCollector(poll) — same pipeline below.
  - Replace PrintActionLayer with SerialActionLayer writing "PLASTIC\\n" etc.

See pipeline/collector.py docstring for a concrete sensor line format example.
"""

from __future__ import annotations

import argparse
import os
import sys
import time
from typing import Optional

# Run as script from raspberry/: ensure package import
_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
if _SCRIPT_DIR not in sys.path:
    sys.path.insert(0, _SCRIPT_DIR)

from pipeline.actions import PrintActionLayer
from pipeline.collector import SimulatedBinCollector
from pipeline.decision import SortingDecisionEngine
from pipeline.detection import MockCamera, MockDetector, OpenCVCamera, YoloDetector
from pipeline.types import TriggerReason
from agss_connect import send_sort_command, send_to_backend


def _label_to_sort_type(label: str) -> Optional[str]:
    normalized = str(label or "").strip().lower()
    if normalized in {"recycle", "recyclable", "recyclables"}:
        return "Recycle"
    if normalized in {"non-bio", "non bio", "non-biodegradable", "non biodegradable"}:
        return "Non-Bio"
    if normalized in {"biodegradable", "bio"}:
        return "Biodegradable"
    if normalized in {"unsorted", "unknown"}:
        return "Unsorted"
    return None


def main() -> int:
    parser = argparse.ArgumentParser(description="AGSS collector-triggered detect → decide → act prototype")
    parser.add_argument(
        "--yolo",
        metavar="PATH",
        help="Path to YOLO .pt weights (requires ultralytics + opencv). If omitted, uses MockDetector.",
    )
    parser.add_argument("--camera", type=int, default=0, help="OpenCV camera index (default 0)")
    parser.add_argument(
        "--mock-camera",
        action="store_true",
        help="Do not open a real webcam; use blank frames (useful on PC without camera)",
    )
    parser.add_argument("--tick", type=float, default=0.2, help="Simulated collector tick interval in seconds")
    parser.add_argument(
        "--confidence-threshold",
        type=float,
        default=float(os.environ.get("ML_CONFIDENCE_THRESHOLD", 0.75)),
        help="Minimum confidence to send sort command (default from ML_CONFIDENCE_THRESHOLD or 0.75)",
    )
    parser.add_argument(
        "--cooldown-ms",
        type=int,
        default=int(os.environ.get("SORT_COOLDOWN_MS", 3000)),
        help="Minimum time between sort requests in milliseconds (default from SORT_COOLDOWN_MS or 3000)",
    )
    parser.add_argument(
        "--show-window",
        action="store_true",
        help="Show webcam preview with detected class overlay.",
    )
    parser.add_argument(
        "--max-events",
        type=int,
        default=0,
        help="Stop after this many triggers (0 = run until Ctrl+C)",
    )
    args = parser.parse_args()

    collector = SimulatedBinCollector(tick_seconds=args.tick)
    decision = SortingDecisionEngine()
    actions = PrintActionLayer()

    if args.yolo:
        try:
            camera = MockCamera() if args.mock_camera else OpenCVCamera(args.camera)
            detector = YoloDetector(args.yolo, device=os.environ.get("YOLO_DEVICE"))
        except Exception as e:
            print("Failed to init YOLO/camera:", e, file=sys.stderr)
            return 1
    else:
        camera = MockCamera()
        detector = MockDetector()
        if not args.mock_camera:
            print("Note: no --yolo; using MockDetector. Pass --yolo weights.pt for real inference.")

    print("Pipeline running. Ctrl+C to stop.")
    if args.max_events:
        print(f"Will stop after {args.max_events} trigger(s).")
    print("Flow: Collector tick -> (trigger?) -> frame -> detect -> decide -> action\n")

    events_handled = 0
    last_sort_sent_at = 0.0
    latest_overlay = "Waiting for detection..."
    try:
        while True:
            trigger = collector.tick()
            time.sleep(args.tick)

            if trigger is None:
                continue

            print(
                f"\n--- Trigger: {trigger.reason.value} | "
                f"fill={trigger.state.fill_level:.2f} weight={trigger.state.weight_kg:.2f}kg "
                f"object_present={trigger.state.object_present} ---"
            )

            ok, frame = camera.read()
            if not ok:
                print("[DETECT] Frame capture failed; using mock path in decision as unknown.")
                from pipeline.types import DetectionResult

                detection = DetectionResult(
                    label="unknown",
                    confidence=0.0,
                    inference_time_s=0.0,
                    frame_ok=False,
                    error="frame_read_failed",
                )
            else:
                detection = detector.detect(frame)

            print(
                f"[DETECT] label={detection.label!r} conf={detection.confidence:.3f} "
                f"time={detection.inference_time_s:.3f}s ok={detection.frame_ok}"
            )
            if detection.error:
                print(f"[DETECT] error: {detection.error}")

            sort_type = _label_to_sort_type(detection.label)
            now = time.time()
            confidence_ok = detection.confidence >= args.confidence_threshold
            cooldown_ok = (now - last_sort_sent_at) * 1000 >= args.cooldown_ms

            if sort_type and confidence_ok and cooldown_ok:
                print(
                    f"[SORT] Calling send_sort_command type={sort_type} "
                    f"conf={detection.confidence:.3f} threshold={args.confidence_threshold} cooldownMs={args.cooldown_ms}"
                )
                send_to_backend(sort_type, processing_time_seconds=detection.inference_time_s)
                sent = send_sort_command(sort_type)
                if sent:
                    last_sort_sent_at = now
                    latest_overlay = f"{sort_type} {detection.confidence:.2f} -> SENT"
                    print(f"[SORT] Sent {sort_type} to backend /api/hardware/sort")
                else:
                    latest_overlay = f"{sort_type} {detection.confidence:.2f} -> SEND FAILED"
                    print(f"[SORT] send_sort_command failed for type={sort_type}", file=sys.stderr)
            else:
                if not sort_type:
                    print(f"[SORT] Skip: unmapped label={detection.label!r}")
                elif not confidence_ok:
                    print(
                        f"[SORT] Skip: confidence too low ({detection.confidence:.3f} < {args.confidence_threshold})"
                    )
                elif not cooldown_ok:
                    elapsed_ms = int((now - last_sort_sent_at) * 1000)
                    print(f"[SORT] Skip: cooldown active ({elapsed_ms}ms/{args.cooldown_ms}ms)")
                latest_overlay = f"{detection.label} {detection.confidence:.2f} (hold)"

            if args.show_window and not args.mock_camera:
                try:
                    import cv2
                    cv2.putText(
                        frame,
                        latest_overlay,
                        (20, 40),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.8,
                        (0, 255, 0),
                        2,
                    )
                    cv2.imshow("AGSS Detection", frame)
                    if cv2.waitKey(1) & 0xFF == ord("q"):
                        print("Window closed by user.")
                        break
                except Exception as e:
                    print(f"[VIEW] Overlay error: {e}")

            cmds = decision.decide(trigger, detection)
            for c in cmds:
                actions.execute(c)

            events_handled += 1
            if args.max_events and events_handled >= args.max_events:
                print("\nReached --max-events; exiting.")
                break

            # Optional: reset full alerts in sim after operator action
            if trigger.reason in (TriggerReason.FILL_THRESHOLD, TriggerReason.WEIGHT_THRESHOLD):
                if collector.state.fill_level < 0.5 and collector.state.weight_kg < 4.0:
                    collector.reset_alerts()

    except KeyboardInterrupt:
        print("\nStopped.")
    finally:
        if hasattr(camera, "release"):
            camera.release()
        if args.show_window and not args.mock_camera:
            try:
                import cv2
                cv2.destroyAllWindows()
            except Exception:
                pass

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
