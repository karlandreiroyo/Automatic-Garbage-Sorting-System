# Backend Login Service

Backend service for handling forgot password functionality using Node.js and Express.

## Features

- Send password reset verification code via email
- Verify reset code
- Reset user password
- Resend verification code
- Integration with Supabase authentication

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env and add your Supabase service role key
```

3. Start the server:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will run on `http://localhost:3001` by default.

## API Endpoints

### POST /api/forgot-password/send-code
Send a verification code to user's email.

**Request Body:**
```json
{
  "emailOrMobile": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification code sent to your email"
}
```

### POST /api/forgot-password/verify-code
Verify the reset code provided by user.

**Request Body:**
```json
{
  "emailOrMobile": "user@example.com",
  "code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Code verified successfully",
  "resetToken": "base64_encoded_token"
}
```

### POST /api/forgot-password/reset
Reset user password with the reset token.

**Request Body:**
```json
{
  "resetToken": "base64_encoded_token",
  "newPassword": "newSecurePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

### POST /api/forgot-password/resend-code
Resend verification code to user's email.

**Request Body:**
```json
{
  "emailOrMobile": "user@example.com"
}
```

### GET /api/health
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "message": "Backend login service is running"
}
```

## Environment Variables

- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment mode (development/production)
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_KEY`: Supabase service role key (required for admin operations)

## Security Notes

- In production, never return verification codes in API responses
- Use a proper token storage solution (Redis, database) instead of in-memory Map
- Implement rate limiting to prevent abuse
- Use HTTPS in production
- Store sensitive keys in environment variables, never commit them to git
