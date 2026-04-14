import cv2
import numpy as np
import requests
import time
from datetime import datetime

# Assuming your ML model is loaded here
# Replace with your actual model loading code
# For example, if using TensorFlow/Keras:
# from tensorflow.keras.models import load_model
# model = load_model('path/to/your/model.h5')

# Placeholder for model prediction
def predict_waste_type(frame):
    """
    Replace this with your actual model inference.
    Should return (waste_type, confidence) where waste_type is one of:
    'Recycle', 'Non-Bio', 'Biodegradable', 'Unsorted'
    """
    # Dummy implementation - replace with real model
    # This should analyze the frame and classify
    waste_types = ['Recycle', 'Non-Bio', 'Biodegradable', 'Unsorted']
    # Random for demo - replace with actual prediction
    predicted_index = np.random.randint(0, 4)
    confidence = np.random.uniform(0.5, 0.95)  # Random confidence
    return waste_types[predicted_index], confidence

# Configuration
BACKEND_URL = 'http://localhost:3001'  # Change to your backend URL
API_ENDPOINT = f'{BACKEND_URL}/api/hardware/sort'
COOLDOWN_SECONDS = 3

# Webcam setup
cap = cv2.VideoCapture(0)  # 0 for default webcam, change if needed
if not cap.isOpened():
    print("Error: Could not open webcam")
    exit()

last_detection_time = 0
font = cv2.FONT_HERSHEY_SIMPLEX

print("Starting ML detection. Press 'q' to quit.")

while True:
    ret, frame = cap.read()
    if not ret:
        print("Error: Could not read frame")
        break

    # Run inference on the frame
    waste_type, confidence = predict_waste_type(frame)

    # Display detection result on frame
    text = f"Detected: {waste_type} ({confidence:.2f})"
    cv2.putText(frame, text, (10, 30), font, 1, (0, 255, 0), 2, cv2.LINE_AA)

    # Check if enough time has passed since last detection
    current_time = time.time()
    if current_time - last_detection_time >= COOLDOWN_SECONDS:
        # Send to backend
        try:
            payload = {
                'waste_type': waste_type,
                'source': 'ml_detection',
                'confidence': confidence
            }
            response = requests.post(API_ENDPOINT, json=payload)
            if response.status_code == 200:
                print(f"Sent {waste_type} to backend (confidence: {confidence:.2f})")
                last_detection_time = current_time
            else:
                print(f"Failed to send to backend: {response.status_code}")
        except Exception as e:
            print(f"Error sending to backend: {e}")

    # Show the frame
    cv2.imshow('Waste Detection', frame)

    # Press 'q' to quit
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()</content>
<parameter name="filePath">/home/admin/Automatic-Garbage-Sorting-System/raspberry/ml_detection.py