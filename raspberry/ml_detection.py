#!/usr/bin/env python3
"""
AGSS ML Detection Script for Raspberry Pi
Captures webcam frames, runs inference on waste classification model,
sends HTTP POST to backend when waste is detected.
"""

import cv2
import numpy as np
import requests
import time
import sys
import os
from datetime import datetime

# Configuration from environment variables
BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:3001')
CAMERA_INDEX = int(os.getenv('CAMERA_INDEX', '0'))
MODEL_PATH = os.getenv('MODEL_PATH', 'path/to/your/model.h5')  # Update with your model path
CONFIDENCE_THRESHOLD = float(os.getenv('CONFIDENCE_THRESHOLD', '0.7'))
COOLDOWN_SECONDS = int(os.getenv('COOLDOWN_SECONDS', '3'))

# Waste classes (must match Arduino commands)
CLASSES = ['Recycle', 'Non-Bio', 'Biodegradable', 'Unsorted']

# Load your ML model here
# Example for TensorFlow/Keras:
# import tensorflow as tf
# model = tf.keras.models.load_model(MODEL_PATH)

# Placeholder model - replace with your actual model loading
class DummyModel:
    def predict(self, image):
        # Random prediction for demo - replace with your model
        class_idx = np.random.randint(0, len(CLASSES))
        confidence = np.random.uniform(0.5, 0.95)
        return CLASSES[class_idx], confidence

model = DummyModel()

def preprocess_image(frame):
    """Preprocess frame for model input"""
    # Resize to your model's expected input size
    resized = cv2.resize(frame, (224, 224))  # Adjust size as needed
    # Normalize if required
    normalized = resized / 255.0
    # Add batch dimension
    return np.expand_dims(normalized, axis=0)

def predict_waste_type(frame):
    """Run inference and return detection result"""
    try:
        processed = preprocess_image(frame)
        # For TensorFlow/Keras:
        # predictions = model.predict(processed)
        # class_idx = np.argmax(predictions[0])
        # confidence = predictions[0][class_idx]

        # Using dummy model for now
        waste_type, confidence = model.predict(processed)

        if confidence >= CONFIDENCE_THRESHOLD:
            return waste_type, confidence
    except Exception as e:
        print(f"Inference error: {e}")
    return None, 0.0

def send_detection(waste_type, confidence):
    """Send detection to backend"""
    try:
        payload = {
            'waste_type': waste_type,
            'source': 'ml_detection',
            'confidence': confidence
        }
        response = requests.post(f"{BACKEND_URL}/api/hardware/sort", json=payload, timeout=5)
        if response.status_code == 200:
            print(f"✓ Sent {waste_type} (confidence: {confidence:.2f}) to backend")
            return True
        else:
            print(f"✗ Backend error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"✗ Failed to send detection: {e}")
    return False

def main():
    print("Starting AGSS ML Detection on Raspberry Pi...")
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Camera index: {CAMERA_INDEX}")
    print(f"Confidence threshold: {CONFIDENCE_THRESHOLD}")
    print(f"Cooldown: {COOLDOWN_SECONDS} seconds")

    # Open webcam
    cap = cv2.VideoCapture(CAMERA_INDEX)
    if not cap.isOpened():
        print("Error: Could not open camera")
        return

    # Set camera properties
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    cap.set(cv2.CAP_PROP_FPS, 30)

    last_detection_time = 0

    print("Camera opened. Running detection loop. Press Ctrl+C to stop.")

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                print("Error: Could not read frame")
                time.sleep(1)
                continue

            # Flip frame if needed (depending on camera orientation)
            frame = cv2.flip(frame, 1)

            # Run detection
            waste_type, confidence = predict_waste_type(frame)

            if waste_type:
                print(f"Detected: {waste_type} (confidence: {confidence:.2f})")

                # Check cooldown
                current_time = time.time()
                if current_time - last_detection_time >= COOLDOWN_SECONDS:
                    if send_detection(waste_type, confidence):
                        last_detection_time = current_time
                else:
                    remaining = COOLDOWN_SECONDS - (current_time - last_detection_time)
                    print(f"Cooldown active: {remaining:.1f}s remaining")
            else:
                print("No waste detected")

            # Small delay to prevent excessive CPU usage
            time.sleep(0.1)

    except KeyboardInterrupt:
        print("\nInterrupted by user")
    finally:
        cap.release()
        print("Camera closed.")

if __name__ == "__main__":
    main()