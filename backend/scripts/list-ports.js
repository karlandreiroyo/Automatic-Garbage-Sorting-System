/**
 * List available serial (COM) ports. Use this to find your Arduino's port for ARDUINO_PORT in .env
 * Run: node scripts/list-ports.js   or  npm run list-ports
 */
const serial = require('serialport');
const SerialPort = serial.SerialPort || serial;

SerialPort.list()
  .then((ports) => {
    if (ports.length === 0) {
      console.log('No serial ports found. Plug in your Arduino and run again.');
      return;
    }
    console.log('Available serial ports (set ARDUINO_PORT in backend/.env to one of these):\n');
    ports.forEach((p) => {
      console.log(`  ${p.path}  ${p.manufacturer || ''}  ${p.serialNumber || ''}`.trim());
    });
  })
  .catch((err) => {
    console.error('Error listing ports:', err.message);
    process.exit(1);
  });
