/**
 * AGSS Arduino – Automatic Garbage Sorting System
 *
 * Output format (backend expects these exact strings, one per line):
 *   RECYCLABLE  – sensor 1 (d1) detects object
 *   NON_BIO     – sensor 2 (d2) detects object
 *   BIO         – sensor 3 (d3) detects object
 *   UNSORTED    – sensor 4 (d4) detects object
 *   Weight: X.X g – no object, show weight only
 *
 * IMPORTANT: Close Arduino Serial Monitor when running the backend!
 * Set ARDUINO_PORT=COM7 in backend/.env
 */

#include <Servo.h>
#include "HX711.h"

// ================= SERVOS =================
Servo servoX;
Servo servoY;

#define SERVO_X_PIN 6
#define SERVO_Y_PIN 7

// X-axis angles
#define X_10_OCLOCK  40
#define X_12_OCLOCK  90
#define X_2_OCLOCK   140

// Y-axis tilt
#define Y_NORMAL     90
#define Y_FRONT_TILT 120
#define Y_BACK_TILT  60

// Current servo position (for smooth movement)
int currentX = X_12_OCLOCK;
int currentY = Y_NORMAL;

#define SERVO_SPEED_DELAY 8  // Lower = faster move

// ============ ULTRASONIC =================
#define TRIG1 2
#define ECHO1 3
#define TRIG2 4
#define ECHO2 5
#define TRIG3 8
#define ECHO3 9
#define TRIG4 10
#define ECHO4 11

#define DETECT_DISTANCE 15  // cm

// ============ LOAD CELL ==================
#define HX_DOUT A0
#define HX_SCK  A1

HX711 scale;
float calibration_factor = -7050;

// Serial: throttle "no object" / weight to avoid spam
unsigned long lastPrint = 0;
#define PRINT_INTERVAL 500

// =========================================

void setup() {
  Serial.begin(9600);

  servoX.attach(SERVO_X_PIN);
  servoY.attach(SERVO_Y_PIN);

  pinMode(TRIG1, OUTPUT); pinMode(ECHO1, INPUT);
  pinMode(TRIG2, OUTPUT); pinMode(ECHO2, INPUT);
  pinMode(TRIG3, OUTPUT); pinMode(ECHO3, INPUT);
  pinMode(TRIG4, OUTPUT); pinMode(ECHO4, INPUT);

  scale.begin(HX_DOUT, HX_SCK);
  scale.set_scale(calibration_factor);
  scale.tare();

  Serial.println("System Ready (Smart Bin Mode)");
  normalPosition();
}

// ================= MAIN LOOP =================
void loop() {
  unsigned long startTime = millis();   // START TIMER

  long d1 = readDistance(TRIG1, ECHO1);
  long d2 = readDistance(TRIG2, ECHO2);
  long d3 = readDistance(TRIG3, ECHO3);
  long d4 = readDistance(TRIG4, ECHO4);

  String detected = "No object";

  // ===== SERVO + CATEGORY LOGIC =====
  if (d1 < DETECT_DISTANCE) {
    moveServos(X_2_OCLOCK, Y_FRONT_TILT);
    detected = "Recyclable";
  }
  else if (d2 < DETECT_DISTANCE) {
    moveServos(X_2_OCLOCK, Y_BACK_TILT);
    detected = "NON-BIO";
  }
  else if (d3 < DETECT_DISTANCE) {
    moveServos(X_10_OCLOCK, Y_FRONT_TILT);
    detected = "Bio";
  }
  else if (d4 < DETECT_DISTANCE) {
    moveServos(X_10_OCLOCK, Y_BACK_TILT);
    detected = "Unsorted";
  }
  else {
    normalPosition();
  }

  unsigned long endTime = millis();     // END TIMER
  unsigned long processingTime = endTime - startTime;

  // ===== SERIAL OUTPUT (throttled; backend parses "Detected: X" and "Weight: X g") =====
  if (millis() - lastPrint >= PRINT_INTERVAL) {
    lastPrint = millis();

    Serial.print("Detected: ");
    Serial.println(detected);

    if (detected == "No object") {
      if (scale.is_ready()) {
        float w = scale.get_units(5);
        Serial.print("Weight: ");
        Serial.print(w, 1);
        Serial.println(" g");
      } else {
        Serial.println("Weight: 0 g");
      }
    }

    Serial.print("Processing Time: ");
    Serial.print(processingTime);
    Serial.println(" ms");

    Serial.println("-----------------------");
  }
}

// ================= FUNCTIONS =================

long readDistance(int trigPin, int echoPin) {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  long duration = pulseIn(echoPin, HIGH, 30000);
  if (duration == 0) return 999;
  return duration * 0.034 / 2;
}

// Smooth move: X first, then Y
void moveServos(int targetX, int targetY) {
  while (currentX != targetX) {
    if (currentX < targetX) currentX++;
    else currentX--;
    servoX.write(currentX);
    delay(SERVO_SPEED_DELAY);
  }
  while (currentY != targetY) {
    if (currentY < targetY) currentY++;
    else currentY--;
    servoY.write(currentY);
    delay(SERVO_SPEED_DELAY);
  }
}

// Return to normal: Y first (flat), then X (center)
void normalPosition() {
  while (currentY != Y_NORMAL) {
    if (currentY < Y_NORMAL) currentY++;
    else currentY--;
    servoY.write(currentY);
    delay(SERVO_SPEED_DELAY);
  }
  while (currentX != X_12_OCLOCK) {
    if (currentX < X_12_OCLOCK) currentX++;
    else currentX--;
    servoX.write(currentX);
    delay(SERVO_SPEED_DELAY);
  }
}
