const crypto = require('crypto');

// Generate 6-digit verification code
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate secure token for second email verification
function generateSecondEmailToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Store verification codes temporarily (in production, use Redis or database)
const verificationCodes = new Map();

// Store second email verification tokens: token -> { email, primaryEmail, userId, expiresAt }
const secondEmailTokens = new Map();

module.exports = {
  generateVerificationCode,
  generateSecondEmailToken,
  verificationCodes,
  secondEmailTokens
};
