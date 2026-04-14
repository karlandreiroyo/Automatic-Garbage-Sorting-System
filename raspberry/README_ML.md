# Raspberry Pi ML Detection

This script runs on a Raspberry Pi with a connected camera to detect waste and send classifications to the AGSS backend.

## Setup

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Update the model path in `ml_detection.py`:
   ```python
   MODEL_PATH = 'path/to/your/trained/model.h5'
   ```

3. Set environment variables (optional):
   ```bash
   export BACKEND_URL='http://your-backend-url:3001'
   export CAMERA_INDEX=0
   export CONFIDENCE_THRESHOLD=0.7
   export COOLDOWN_SECONDS=3
   ```

4. Run the detection:
   ```bash
   python ml_detection.py
   ```

## Model Integration

Replace the `DummyModel` class with your actual model loading and prediction code. Your model should:

- Accept 224x224x3 input images
- Return predictions for: ['Recycle', 'Non-Bio', 'Biodegradable', 'Unsorted']
- Include confidence scores

## Running Headless

The script runs without GUI display, suitable for headless Raspberry Pi operation. It logs detections to console and sends results to the backend automatically.