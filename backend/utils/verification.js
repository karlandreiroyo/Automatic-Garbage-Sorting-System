// Generate 6-digit verification code
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Store verification codes temporarily (in production, use Redis or database)
const verificationCodes = new Map();

module.exports = {
  generateVerificationCode,
  verificationCodes
};
