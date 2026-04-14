# AGSS ML Detection Deployment

This service runs the machine learning waste detection and integrates with the AGSS backend.

## Local Development

1. Install dependencies:
   ```bash
   pip install -r requirements-ml.txt
   ```

2. Update the model path in `ml_detection.py`:
   ```python
   MODEL_PATH = 'path/to/your/trained/model.h5'
   ```

3. Run the detection:
   ```bash
   python ml_detection.py
   ```

## Docker Deployment

1. Place your trained model file as `model.h5` in the project root.

2. Update the device path in `docker-compose.local.yml` if your camera is not `/dev/video0`:
   ```yaml
   devices:
     - /dev/video0:/dev/video0  # Change this to your camera device
   ```

3. Build and run with Docker Compose:
   ```bash
   docker-compose -f docker-compose.local.yml up --build ml-detection
   ```

## Configuration

Environment variables:

- `BACKEND_URL`: URL of the AGSS backend (default: http://localhost:3001)
- `CAMERA_INDEX`: Camera device index (default: 0)
- `MODEL_PATH`: Path to your trained model (default: /app/model.h5)
- `CONFIDENCE_THRESHOLD`: Minimum confidence for detection (default: 0.7)
- `COOLDOWN_SECONDS`: Seconds to wait between detections (default: 3)

## Model Requirements

Your model should:
- Accept input shape compatible with `preprocess_image()` (224x224x3 by default)
- Output class probabilities for: ['Recycle', 'Non-Bio', 'Biodegradable', 'Unsorted']
- Be loadable with TensorFlow/Keras or your preferred framework

Update the `DummyModel` class in `ml_detection.py` with your actual model loading and prediction code.