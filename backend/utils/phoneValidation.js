'use strict';

/**
 * Phone number validation and formatting utilities
 * Limited to Philippine phone numbers only
 * 
 * @module phoneValidation
 */

/**
 * Validate if a phone number is a valid Philippine number
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid Philippine number
 */
function isValidPhilippineNumber(phone) {
  if (!phone || typeof phone !== 'string') return false;
  
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // Remove + if present for validation
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  
  // Philippine numbers:
  // - Must start with 63 (country code)
  // - Followed by 9 (mobile prefix)
  // - Followed by 9 digits (total 11 digits after country code)
  // OR
  // - Starts with 0 (local format)
  // - Followed by 9 (mobile prefix)
  // - Followed by 9 digits (total 11 digits: 0 + 9 + 9 digits)
  // OR
  // - Starts with 9 (without prefix)
  // - Followed by 9 digits (total 10 digits)
  
  // Check if it's in international format: +639XXXXXXXXX or 639XXXXXXXXX
  if (cleaned.startsWith('63')) {
    // Should be 63 + 9 + 9 digits = 11 digits total
    if (cleaned.length === 11 && cleaned[2] === '9') {
      return /^639\d{9}$/.test(cleaned);
    }
  }
  
  // Check if it's in local format: 09XXXXXXXXX (11 digits: 0 + 9 + 9 digits)
  if (cleaned.startsWith('0')) {
    // Should be 0 + 9 + 9 digits = 11 digits total
    if (cleaned.length === 11 && cleaned[1] === '9') {
      return /^09\d{9}$/.test(cleaned);
    }
  }
  
  // Check if it's just 9XXXXXXXXX (10 digits, starts with 9)
  if (cleaned.length === 10 && cleaned[0] === '9') {
    return /^9\d{9}$/.test(cleaned);
  }
  
  return false;
}

/**
 * Format Philippine phone number to standard format (+639XXXXXXXXX)
 * @param {string} phone - Phone number to format
 * @returns {string|null} - Formatted phone number or null if invalid
 */
function formatPhilippineNumber(phone) {
  if (!isValidPhilippineNumber(phone)) {
    return null;
  }
  
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // Remove + if present
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  
  // Convert to international format
  if (cleaned.startsWith('63')) {
    // Already in international format
    return '+' + cleaned;
  } else if (cleaned.startsWith('0')) {
    // Local format: 09XXXXXXXXX -> +639XXXXXXXXX
    return '+63' + cleaned.substring(1);
  } else if (cleaned.length === 10 && cleaned[0] === '9') {
    // 9XXXXXXXXX -> +639XXXXXXXXX
    return '+63' + cleaned;
  }
  
  return null;
}

/**
 * Normalize phone number for database storage/search
 * Stores in format: +639XXXXXXXXX
 * @param {string} phone - Phone number to normalize
 * @returns {string|null} - Normalized phone number or null if invalid
 */
function normalizePhilippineNumber(phone) {
  return formatPhilippineNumber(phone);
}

module.exports = {
  isValidPhilippineNumber,
  formatPhilippineNumber,
  normalizePhilippineNumber,
};
