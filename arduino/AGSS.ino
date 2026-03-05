/**
 * AGSS Arduino – Automatic Garbage Sorting System
 * Servos + 4 bin fullness ultrasonics + validation sensor + LED.
 *
 * CONNECTED TO:
 * - Backend: backend sends same commands over Serial (collector clicks "Sort here" in app).
 * - Arduino IDE: open Serial Monitor (9600 baud, "Newline" line ending), type one of the
 *   commands below and press Enter – servo tilts to that bin.
 *
 * SERIAL COMMANDS (same from IDE or backend):
 *   Recycle        → tilt to Recyclable bin (X 2 o'clock, Y front)
 *   Non-Bio        → tilt to Non-Biodegradable bin (X 2 o'clock, Y back)
 *   Biodegradable  → tilt to Biodegradable bin (X 10 o'clock, Y front)
 *   Unsorted       → tilt to Unsorted bin (X 10 o'clock, Y back)
 *
 * Set ARDUINO_PORT=COMx in backend/.env. Close Serial Monitor when using the web app.
 */
#include <Servo.h>

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

int currentX = X_12_OCLOCK;
int currentY = Y_NORMAL;
#define SERVO_SPEED_DELAY 8

// ============ FULLNESS ULTRASONICS (4 bins) ============
#define F_TRIG1 2
#define F_ECHO1 3
#define F_TRIG2 4
#define F_ECHO2 5
#define F_TRIG3 8
#define F_ECHO3 9
#define F_TRIG4 10
#define F_ECHO4 11

#define BIN_HEIGHT_CM 45.7 // 18 inches

// ============ VALIDATION SENSOR ============
#define VALID_TRIG A0
#define VALID_ECHO A1

// ============ LED PINS ============
#define LED_READY 13
#define LED_NOT_READY A2

// ============ PRINT TIMING ============
unsigned long lastPrintTime = 0;
#define PRINT_INTERVAL 1000  // 1 second

// =====================================================
void setup() {
  Serial.begin(9600);

  servoX.attach(SERVO_X_PIN);
  servoY.attach(SERVO_Y_PIN);

  pinMode(F_TRIG1, OUTPUT); pinMode(F_ECHO1, INPUT);
  pinMode(F_TRIG2, OUTPUT); pinMode(F_ECHO2, INPUT);
  pinMode(F_TRIG3, OUTPUT); pinMode(F_ECHO3, INPUT);
  pinMode(F_TRIG4, OUTPUT); pinMode(F_ECHO4, INPUT);

  pinMode(VALID_TRIG, OUTPUT); pinMode(VALID_ECHO, INPUT);

  pinMode(LED_READY, OUTPUT);
  pinMode(LED_NOT_READY, OUTPUT);

  normalPosition();
  Serial.println(F("AGSS ready. Send: Recycle | Non-Bio | Biodegradable | Unsorted"));
}

// ================= LOOP ===================
void loop() {
  // --- Slow down Serial prints ---
  if (millis() - lastPrintTime >= PRINT_INTERVAL) {
    lastPrintTime = millis();
    printBinPercentages(); // Only bins >=10% printed inside
  }

  // --- Check if any bin is full (priority for LEDs) ---
  if (isAnyBinFull()) {
    digitalWrite(LED_READY, HIGH);
    digitalWrite(LED_NOT_READY, HIGH);
  } else {
    // --- Check validation sensor ---
    if (!isDistanceStable()) {
      setReadyState(false);  // READY OFF, NOT READY ON
      return;                // Skip sorting
    } else {
      setReadyState(true);   // READY ON, NOT READY OFF
    }
  }

  // --- Serial command processing (from backend) ---
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    processCommand(command);
  }
}

// ==================== LED CONTROL ======================
void setReadyState(bool ready) {
  if (ready) {
    digitalWrite(LED_READY, HIGH);
    digitalWrite(LED_NOT_READY, LOW);
  } else {
    digitalWrite(LED_READY, LOW);
    digitalWrite(LED_NOT_READY, HIGH);
  }
}

// ==================== FULLNESS CHECK ==================
bool isAnyBinFull() {
  return (isBinFull(1) || isBinFull(2) || isBinFull(3) || isBinFull(4));
}

bool isBinFull(int binNumber) {
  float percent = getBinPercentage(binNumber);
  return (percent >= 100);
}

float getBinPercentage(int binNumber) {
  long distance = 999;

  if (binNumber == 1) distance = readDistance(F_TRIG1, F_ECHO1);
  if (binNumber == 2) distance = readDistance(F_TRIG2, F_ECHO2);
  if (binNumber == 3) distance = readDistance(F_TRIG3, F_ECHO3);
  if (binNumber == 4) distance = readDistance(F_TRIG4, F_ECHO4);

  float percent = (1 - (distance / BIN_HEIGHT_CM)) * 100;
  percent = constrain(percent, 0, 100);
  percent = round(percent / 10.0) * 10; // tenths
  return percent;
}

// Print fullness percentages for bins >=10%
void printBinPercentages() {
  for (int i = 1; i <= 4; i++) {
    float percent = getBinPercentage(i);
    if (percent >= 10) {
      Serial.print("Bin ");
      Serial.print(i);
      Serial.print(": ");
      Serial.print(percent);
      Serial.println("%");
    }
  }
}

// ==================== DISTANCE VALIDATION ==================
bool isDistanceStable() {
  long d1 = readDistance(VALID_TRIG, VALID_ECHO);
  delay(50);
  long d2 = readDistance(VALID_TRIG, VALID_ECHO);
  delay(50);
  long d3 = readDistance(VALID_TRIG, VALID_ECHO);

  bool stable = (abs(d1 - d2) < 3 && abs(d2 - d3) < 3);

  // Disable sorting if validation sensor reads over 1 foot (~30.48 cm)
  if (d1 > 30.48 || d2 > 30.48 || d3 > 30.48) {
    stable = false;
  }

  return stable;
}

// ==================== SERIAL COMMAND PROCESSING ==================
// Commands from backend (POST /api/hardware/sort). Reply TYPE:XXX so frontend updates.
void processCommand(String cmd) {
  if (cmd == "Recycle" && !isBinFull(1)) {
    sortTo(X_2_OCLOCK, Y_FRONT_TILT);
    Serial.println("TYPE:RECYCABLE");
  } else if (cmd == "Non-Bio" && !isBinFull(2)) {
    sortTo(X_2_OCLOCK, Y_BACK_TILT);
    Serial.println("TYPE:NON_BIO");
  } else if (cmd == "Biodegradable" && !isBinFull(3)) {
    sortTo(X_10_OCLOCK, Y_FRONT_TILT);
    Serial.println("TYPE:BIO");
  } else if (cmd == "Unsorted" && !isBinFull(4)) {
    sortTo(X_10_OCLOCK, Y_BACK_TILT);
    Serial.println("TYPE:UNSORTED");
  }
}

// ==================== ULTRASONIC HELPER ==================
long readDistance(int trigPin, int echoPin) {
  digitalWrite(trigPin, LOW); delayMicroseconds(2);
  digitalWrite(trigPin, HIGH); delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  long duration = pulseIn(echoPin, HIGH, 30000);
  if (duration == 0) return 999;
  return duration * 0.034 / 2;
}

// ==================== SERVO MOVEMENT ==================
void sortTo(int targetX, int targetY) {
  digitalWrite(LED_READY, LOW);
  digitalWrite(LED_NOT_READY, HIGH);

  moveServos(targetX, targetY);
  delay(800);
  normalPosition();

  setReadyState(true);
}

void moveServos(int targetX, int targetY) {
  while (currentX != targetX) {
    currentX += (currentX < targetX) ? 1 : -1;
    servoX.write(currentX);
    delay(SERVO_SPEED_DELAY);
  }
  while (currentY != targetY) {
    currentY += (currentY < targetY) ? 1 : -1;
    servoY.write(currentY);
    delay(SERVO_SPEED_DELAY);
  }
}

void normalPosition() {
  while (currentY != Y_NORMAL) {
    currentY += (currentY < Y_NORMAL) ? 1 : -1;
    servoY.write(currentY);
    delay(SERVO_SPEED_DELAY);
  }
  while (currentX != X_12_OCLOCK) {
    currentX += (currentX < X_12_OCLOCK) ? 1 : -1;
    servoX.write(currentX);
    delay(SERVO_SPEED_DELAY);
  }
}
