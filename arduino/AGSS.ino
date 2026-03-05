/**
 * AGSS Arduino – Automatic Garbage Sorting System
 * 
 * Output format (backend expects these exact strings, one per line):
 *   RECYCABLE   – sensor 1 (d1) detects object
 *   NON_BIO     – sensor 2 (d2) detects object
 *   BIO         – sensor 3 (d3) detects object
 *   UNSORTED    – sensor 4 (d4) detects object
 *   Weight: X.X g – no object, show weight only
 * 
 * IMPORTANT: Close Arduino Serial Monitor when running the backend!
 * Both use the same COM port – only one can connect at a time.
 * Set ARDUINO_PORT=COMx (e.g. COM5, COM7, COM8) in backend/.env
 */

#include <Servo.h>
#include "HX711.h"

// ================= SERVOS =================
Servo servoX;
Servo servoY;

#define SERVO_X_PIN 6
#define SERVO_Y_PIN 7

#define X_10_OCLOCK  40
#define X_12_OCLOCK  90
#define X_2_OCLOCK   140

#define Y_NORMAL     90
#define Y_FRONT_TILT 120
#define Y_BACK_TILT  60

// Smoother servo: track position, step X then Y (to bin), Y then X (return)
int currentX = X_12_OCLOCK;
int currentY = Y_NORMAL;
#define SERVO_SPEED_DELAY 1
#define SERVO_PAUSE_MS    120

// ============ ULTRASONIC =================
#define TRIG1 2
#define ECHO1 3
#define TRIG2 4
#define ECHO2 5
#define TRIG3 8
#define ECHO3 9
#define TRIG4 10
#define ECHO4 11

#define DETECT_DISTANCE 15

// ============ LOAD CELL ==================
#define HX_DOUT A0
#define HX_SCK  A1

HX711 scale;

// Change this after calibration
float calibration_factor = -7050;

// ===== PROCESSING TIME (optional; backend ignores "Time: X ms" but keeps same flow) =====
unsigned long startTime;
unsigned long endTime;
unsigned long processingTime;

// =========================================

void setup() {
  Serial.begin(9600);

  servoX.attach(SERVO_X_PIN);
  servoY.attach(SERVO_Y_PIN);

  pinMode(TRIG1, OUTPUT); pinMode(ECHO1, INPUT);
  pinMode(TRIG2, OUTPUT); pinMode(ECHO2, INPUT);
  pinMode(TRIG3, OUTPUT); pinMode(ECHO3, INPUT);
  pinMode(TRIG4, OUTPUT); pinMode(ECHO4, INPUT);

  // HX711 init
  scale.begin(HX_DOUT, HX_SCK);
  scale.set_scale(calibration_factor);
  scale.tare(); // zero weight

  Serial.println("System Ready");
  normalPosition();
}

// ================= MAIN LOOP =================
void loop() {

  startTime = millis();   // START TIMER

  long d1 = readDistance(TRIG1, ECHO1);
  long d2 = readDistance(TRIG2, ECHO2);
  long d3 = readDistance(TRIG3, ECHO3);
  long d4 = readDistance(TRIG4, ECHO4);

  // ===== ULTRASONIC HAS PRIORITY =====
  if (d1 < DETECT_DISTANCE) {
    Serial.println("RECYCABLE");
    moveServos(X_2_OCLOCK, Y_FRONT_TILT);
  }

  else if (d2 < DETECT_DISTANCE) {
    Serial.println("NON_BIO");
    moveServos(X_2_OCLOCK, Y_BACK_TILT);
  }

  else if (d3 < DETECT_DISTANCE) {
    Serial.println("BIO");
    moveServos(X_10_OCLOCK, Y_FRONT_TILT);
  }

  else if (d4 < DETECT_DISTANCE) {
    Serial.println("UNSORTED");
    moveServos(X_10_OCLOCK, Y_BACK_TILT);
  }

  // ===== NO OBJECT → SHOW WEIGHT ONLY =====
  else {
    normalPosition();

    if (scale.is_ready()) {
      float weight = scale.get_units(5);
      Serial.print("Weight: ");
      Serial.print(weight, 1);
      Serial.println(" g");
    }
  }

  endTime = millis();
  processingTime = endTime - startTime;
  Serial.print("Time: ");
  Serial.print(processingTime);
  Serial.println(" ms");

  delay(300);
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

// Smoother: move X first, then Y (to bin)
void moveServos(int targetX, int targetY) {
  while (currentX != targetX) {
    if (currentX < targetX) currentX++;
    else currentX--;
    servoX.write(currentX);
    delay(SERVO_SPEED_DELAY);
  }
  delay(SERVO_PAUSE_MS);
  while (currentY != targetY) {
    if (currentY < targetY) currentY++;
    else currentY--;
    servoY.write(currentY);
    delay(SERVO_SPEED_DELAY);
  }
}

// Smoother: return to center — Y first, then X
void normalPosition() {
  while (currentY != Y_NORMAL) {
    if (currentY < Y_NORMAL) currentY++;
    else currentY--;
    servoY.write(currentY);
    delay(SERVO_SPEED_DELAY);
  }
  delay(SERVO_PAUSE_MS);
  while (currentX != X_12_OCLOCK) {
    if (currentX < X_12_OCLOCK) currentX++;
    else currentX--;
    servoX.write(currentX);
    delay(SERVO_SPEED_DELAY);
  }
}
