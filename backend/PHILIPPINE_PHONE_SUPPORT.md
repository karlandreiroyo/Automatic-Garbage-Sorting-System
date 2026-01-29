# 📱 Philippine Phone Number Support for Password Reset

## Overview

The password reset functionality now supports Philippine phone numbers in addition to email addresses. Users can enter their Philippine phone number to receive password reset verification codes via email.

## Supported Phone Number Formats

The system accepts Philippine phone numbers in the following formats:

1. **International format (recommended):**
   - `+639123456789`
   - `639123456789` (without + sign)

2. **Local format:**
   - `09123456789` (starts with 0)
   - `9123456789` (10 digits, starts with 9)

All formats are automatically converted to the standard format: `+639123456789`

## How It Works

1. **User enters phone number** in the password reset form
2. **System validates** the phone number (Philippine numbers only)
3. **System looks up user** by phone number in the database
4. **System retrieves user's email** from the database
5. **System sends verification code** to the user's email address (via SMTP)
6. **User enters code** to verify and reset password

## Phone Number Validation Rules

- ✅ Must be a Philippine mobile number
- ✅ Must start with country code `63` or local prefix `0` or `9`
- ✅ Must have exactly 10 digits after country code (for +63 format)
- ✅ Must have exactly 10 digits total (for local format)
- ❌ Landline numbers are not supported (only mobile numbers starting with 9)

## API Endpoints

### 1. Send Password Reset Code

**Endpoint:** `POST /api/forgot-password/send-code`

**Request Body:**
```json
{
  "emailOrMobile": "+639123456789"
}
```

or

```json
{
  "emailOrMobile": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification code sent to user@example.com. Check your email for \"Reset Password Verification\". Code is also logged in terminal."
}
```

### 2. Verify Code

**Endpoint:** `POST /api/forgot-password/verify-code`

**Request Body:**
```json
{
  "emailOrMobile": "+639123456789",
  "code": "123456"
}
```

### 3. Resend Code

**Endpoint:** `POST /api/forgot-password/resend-code`

**Request Body:**
```json
{
  "emailOrMobile": "+639123456789"
}
```

## Database Requirements

The system looks for phone numbers in the following fields (in order):
1. `phone`
2. `phone_number`
3. `mobile`

**Important:** The user account must have:
- A valid phone number stored in one of the above fields
- A valid email address (verification codes are sent via email)

## Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Please use a valid email address or Philippine phone number" | Invalid format | Use one of the supported formats |
| "User not found with phone number" | Phone not in database | Ensure phone is saved in user account |
| "User account does not have an email address" | No email on account | Contact administrator |

## Example Usage

### Valid Phone Numbers:
- ✅ `+639123456789`
- ✅ `639123456789`
- ✅ `09123456789`
- ✅ `9123456789`

### Invalid Phone Numbers:
- ❌ `+1234567890` (Not Philippine)
- ❌ `08123456789` (Doesn't start with 9)
- ❌ `912345678` (Too short)
- ❌ `91234567890` (Too long)

## Testing

1. **Test with valid Philippine number:**
   ```bash
   curl -X POST http://localhost:3001/api/forgot-password/send-code \
     -H "Content-Type: application/json" \
     -d '{"emailOrMobile": "+639123456789"}'
   ```

2. **Check terminal** for verification code (if SMTP not configured)
3. **Check email** for verification code (if SMTP configured)
4. **Verify code** using the `/verify-code` endpoint

## Notes

- Phone numbers are normalized to `+639XXXXXXXXX` format for storage/comparison
- Verification codes are always sent via **email** (not SMS)
- The system uses SMTP for email delivery
- Phone validation is limited to Philippine mobile numbers only
