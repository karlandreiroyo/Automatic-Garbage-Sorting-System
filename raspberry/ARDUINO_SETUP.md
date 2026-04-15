# NutriBin Arduino Servo Integration

This directory contains the Arduino servo control integration for the NutriBin garbage sorting system.

## Hardware Requirements

- Arduino board (Uno, Nano, Mega, etc.)
- Servo motor (SG90 or similar)
- Jumper wires
- USB cable for Arduino-Raspberry Pi connection

## Arduino Setup

### 1. Upload the Sketch

1. Open `NutriBin_Servo_Sorter.ino` in Arduino IDE
2. Connect your Arduino board to your computer
3. Select the correct board and port in Arduino IDE
4. Upload the sketch

### 2. Wiring

Connect the servo motor to your Arduino:
- **Signal wire** (usually yellow/orange) → Arduino pin 9
- **Power wire** (usually red) → Arduino 5V
- **Ground wire** (usually black/brown) → Arduino GND

### 3. Servo Angle Mapping

The servo moves to different angles based on garbage categories:
- **Biodegradable** → 0°
- **Recyclable** → 90°
- **Non-Recyclable** → 180°

After sorting, the servo returns to neutral position (90°).

## Raspberry Pi Setup

### 1. Install Dependencies

```bash
pip install pyserial python-dotenv
```

### 2. Configure Serial Port

1. Copy `env.example` to `.env`:
   ```bash
   cp env.example .env
   ```

2. Edit `.env` and set the correct Arduino port:
   ```bash
   ARDUINO_PORT=/dev/ttyUSB0  # or /dev/ttyACM0, etc.
   ```

3. Find your Arduino port:
   ```bash
   ls /dev/tty*
   ```
   Look for `ttyUSB*` or `ttyACM*` devices.

### 3. Test Serial Connection

Run the desktop app - it will automatically attempt to connect to the Arduino on startup.

## Integration Flow

1. **YOLO Detection**: Desktop app detects garbage using computer vision
2. **Arduino Command**: `send_to_arduino(category)` sends serial command to Arduino
3. **Servo Movement**: Arduino moves servo to correct bin position
4. **WebSocket Update**: Desktop app sends `bin_update` message to server
5. **Bin Monitoring**: Web app updates fill levels and shows alerts

## Troubleshooting

### Arduino Connection Issues

- **Port not found**: Check `ls /dev/tty*` and update `ARDUINO_PORT` in `.env`
- **Permission denied**: Add user to dialout group: `sudo usermod -a -G dialout $USER`
- **Connection fails**: Check USB cable, Arduino power, and correct board selection in IDE

### Servo Issues

- **Servo not moving**: Check wiring and power supply
- **Wrong angles**: Verify servo is properly calibrated (0-180° range)
- **Jittery movement**: Ensure stable power supply to servo

### Serial Communication

- **No response from Arduino**: Check baud rate (9600) matches in both code
- **Garbled data**: Ensure Arduino serial monitor is closed when running Python script
- **Timeout errors**: Check USB connection stability

## Serial Commands

The Arduino accepts these commands via serial:
- `biodegradable` - Move to biodegradable bin (0°)
- `recyclable` - Move to recyclable bin (90°)
- `non-recyclable` - Move to non-recyclable bin (180°)

Commands are case-insensitive and can include variations like "nonrecyclable", "bio", etc.

## WebSocket Messages

When sorting occurs, the system sends:
```json
{
  "type": "bin_update",
  "category": "biodegradable",
  "increment": 10
}
```

This increments the appropriate bin's fill level by 10% in the monitoring system.