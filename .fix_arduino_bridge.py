from pathlib import Path
import re

path = Path('backend/scripts/arduino-bridge.js')
text = path.read_text()
start = text.index("require('dotenv')")
end = text.index('if (!BACKEND_URL)')
replacement = (
    "require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });\n"
    "const BACKEND_URL = (process.env.BACKEND_URL || process.env.API_URL || process.env.VITE_API_URL || '').replace(/\/$/, '');\n"
    "const ARDUINO_PORT = process.env.ARDUINO_PORT || '/dev/ttyUSB0'; // or COM7, COM8, etc. — any COM port\n"
    "const BAUD = Number(process.env.ARDUINO_BAUD || 9600);\n\n"
)
path.write_text(text[:start] + replacement + text[end:])
