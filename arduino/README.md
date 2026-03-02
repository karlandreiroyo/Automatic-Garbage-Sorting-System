# Arduino AGSS – Hardware Setup

This sketch runs on **Arduino Uno** and sends waste detection + weight data to the backend over **serial (USB)**.

## Output Format (backend expects these)

| Arduino sends      | Meaning              |
|--------------------|----------------------|
| `RECYCABLE`        | Sensor 1 (d1) object |
| `NON_BIO`          | Sensor 2 (d2) object |
| `BIO` or `bio`     | Sensor 3 (d3) object |
| `UNSORTED`         | Sensor 4 (d4) object |
| `Weight: X.X g`    | No object, weight only |

## Critical: COM Port Conflict

**Arduino Serial Monitor and the backend use the SAME COM port.** Only ONE can be connected at a time.

| If you want...            | Then...                          |
|---------------------------|-----------------------------------|
| **Backend to receive data** | **Close Arduino Serial Monitor** |
| To debug in Serial Monitor | Stop the backend server          |

1. Close Arduino IDE Serial Monitor (or disconnect Arduino from IDE).
2. Set `ARDUINO_PORT=COM7` in `backend/.env` (use your actual port: COM5, COM7, etc.).
3. Start the backend: `cd backend && npm start`.
4. Open Collector Bin Monitoring in the app – data should flow to the database.

## Backend .env

```env
ARDUINO_PORT=COM7
ARDUINO_BAUD=9600
```

## Why "It doesn't work"

- **Serial Monitor open?** Close it – the backend needs exclusive access to COM7.
- **Wrong port?** Check Device Manager (Windows) or `ls /dev/cu.*` (Mac) for the correct port.
- **Backend not started?** Run `npm start` in the backend folder.
- **Constant UNSORTED?** Sensor 4 (d4) may be too close to a surface – adjust `DETECT_DISTANCE` or sensor position.
