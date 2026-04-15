#include <Servo.h>

// Servo control for NutriBin garbage sorting system
// Listens for serial commands from Raspberry Pi and moves servo to sort garbage

Servo sortingServo;
const int SERVO_PIN = 9;  // Pin connected to servo signal wire

// Servo angles for different garbage categories
const int BIODEGRADABLE_ANGLE = 0;    // Biodegradable bin
const int RECYCLABLE_ANGLE = 90;      // Recyclable bin
const int NON_RECYCLABLE_ANGLE = 180; // Non-recyclable bin
const int NEUTRAL_ANGLE = 90;         // Home/neutral position

// Timing constants
const int SERVO_DELAY = 1000;  // Time to hold position (ms)
const int RETURN_DELAY = 500;  // Time before returning to neutral (ms)

void setup() {
  Serial.begin(9600);  // Match Raspberry Pi baud rate
  sortingServo.attach(SERVO_PIN);

  // Start in neutral position
  sortingServo.write(NEUTRAL_ANGLE);
  delay(500);

  Serial.println("NutriBin Arduino ready - waiting for commands...");
}

void loop() {
  // Check for serial commands
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');
    command.trim();  // Remove whitespace

    Serial.print("Received command: ");
    Serial.println(command);

    // Process command and move servo
    if (command.equalsIgnoreCase("biodegradable")) {
      sortToBin(BIODEGRADABLE_ANGLE, "Biodegradable");
    }
    else if (command.equalsIgnoreCase("recyclable")) {
      sortToBin(RECYCLABLE_ANGLE, "Recyclable");
    }
    else if (command.equalsIgnoreCase("non-recyclable") || command.equalsIgnoreCase("nonrecyclable")) {
      sortToBin(NON_RECYCLABLE_ANGLE, "Non-Recyclable");
    }
    else {
      Serial.println("Unknown command - ignoring");
    }
  }
}

void sortToBin(int angle, String binName) {
  Serial.print("Sorting to ");
  Serial.print(binName);
  Serial.println(" bin...");

  // Move to sorting position
  sortingServo.write(angle);
  delay(SERVO_DELAY);

  // Return to neutral position
  sortingServo.write(NEUTRAL_ANGLE);
  delay(RETURN_DELAY);

  Serial.print("Sorting complete - returned to neutral (");
  Serial.print(NEUTRAL_ANGLE);
  Serial.println("°)");
}