# API Documentation - Automatic Garbage Sorting System

This document lists all the APIs and external services used in this system.

---

## 🔌 External APIs & Services

### 1. **Supabase** (Database & Authentication)
- **Service**: Backend-as-a-Service (BaaS) platform
- **Purpose**: 
  - Database storage (PostgreSQL)
  - User authentication and authorization
  - Admin operations (user creation, password updates)
- **Configuration**:
  - **URL**: `https://aezdtsjycbsygqnsvkbz.supabase.co`
  - **Service Role Key**: Required in `backend/.env` as `SUPABASE_SERVICE_KEY`
  - **Package**: `@supabase/supabase-js` (v2.90.1)
- **Usage**:
  - User authentication (`supabase.auth.admin.createUser`, `supabase.auth.admin.updateUserById`)
  - Database queries (`supabase.from('users').select()`, `supabase.from('users').insert()`)
  - Activity logging (`supabase.from('activity_logs').insert()`)

---

### 2. **Semaphore API** (SMS Gateway)
- **Service**: Philippine SMS gateway service
- **Purpose**: Send SMS messages to Philippine phone numbers
- **API Endpoint**: `https://api.semaphore.co/api/v4/messages`
- **Configuration** (in `backend/.env`):
  - `SEMAPHORE_API_KEY` - Your Semaphore API key (required)
  - `SMS_SENDER` - Sender name (optional, default: "SEMAPHORE", max 11 characters)
- **Usage**:
  - Password reset verification codes via SMS
  - Employee account credentials via SMS
- **Pricing**: ~₱0.50 per SMS message
- **Documentation**: https://semaphore.co/

---

### 3. **SMTP/Gmail** (Email Service)
- **Service**: Email sending via SMTP protocol
- **Purpose**: Send email notifications and verification codes
- **Configuration** (in `backend/.env`):
  - `SMTP_HOST` - SMTP server (e.g., `smtp.gmail.com`)
  - `SMTP_PORT` - SMTP port (e.g., `587` for Gmail)
  - `SMTP_USER` - Sender email address (Gmail account)
  - `SMTP_PASS` - App Password (16-character Gmail App Password)
  - `SMTP_FROM` - Display name and email (e.g., `"System Name <email@gmail.com>"`)
- **Package**: `nodemailer` (via npm)
- **Usage**:
  - Login verification codes
  - Password reset codes
  - Password change notifications
  - Security alerts
  - New employee account credentials
- **Note**: Uses Gmail App Passwords for authentication (not regular password)

---

## 🛠️ Custom Backend API (Express.js)

The system runs a custom Express.js server on **port 3001** (configurable via `PORT` in `.env`).

### Base URL
```
http://localhost:3001
```

### API Endpoints

#### **Health Check**
- `GET /api/health`
- Returns server status

---

#### **Account Management** (`/api/accounts`)

##### Verify Email
- `POST /api/accounts/verify-email`
- **Body**: `{ email, first_name, last_name, middle_name? }`
- **Response**: `{ success, message, password?, emailSent?, emailError? }`
- Verifies email format/availability and sends credentials immediately

##### Create Employee
- `POST /api/accounts/create-employee`
- **Body**: `{ first_name, last_name, middle_name?, email, role, password? }`
- **Response**: `{ success, message, sentToEmail?, sentToSms?, emailError?, smsError? }`
- Creates new employee account in Supabase

##### Resend Credentials (Email)
- `POST /api/accounts/resend-credentials-email`
- **Body**: `{ email }`
- Resends employee credentials via email

##### Resend Credentials (SMS)
- `POST /api/accounts/resend-credentials-sms`
- **Body**: `{ email }`
- Resends employee credentials via SMS

---

#### **Password Reset** (`/api/forgot-password`)

##### Request Reset Code
- `POST /api/forgot-password/request`
- **Body**: `{ identifier }` (email or phone)
- Generates and sends reset code via email or SMS

##### Verify Reset Code
- `POST /api/forgot-password/verify`
- **Body**: `{ identifier, code }`
- Verifies the reset code

##### Reset Password
- `POST /api/forgot-password/reset`
- **Body**: `{ identifier, code, newPassword }`
- Resets user password after verification

##### Resend Code
- `POST /api/forgot-password/resend`
- **Body**: `{ identifier }`
- Regenerates and resends reset code

---

#### **Profile Password** (`/api/profile`)

##### Change Password (with verification)
- `POST /api/profile/change-password`
- **Body**: `{ userId, currentPassword, newPassword }`
- Changes user password with email verification

---

#### **Login Verification** (`/api/login`)

##### Send Login Code
- `POST /api/login/send-code`
- **Body**: `{ email }`
- Sends login verification code via email

##### Verify Login Code
- `POST /api/login/verify-code`
- **Body**: `{ email, code }`
- Verifies login code

---

#### **Security Alerts** (`/api/security`)

##### Send Security Alert
- `POST /api/security/alert`
- **Body**: `{ email, message }`
- Sends security alert email (e.g., suspicious login attempts)

---

## 📦 Dependencies

### Backend Dependencies
- `express` - Web server framework
- `cors` - Cross-Origin Resource Sharing
- `dotenv` - Environment variable management
- `@supabase/supabase-js` - Supabase client library
- `nodemailer` - Email sending library

### Frontend Dependencies
- `react` - UI framework
- `react-dom` - React DOM rendering
- `react-router-dom` - Routing
- `@supabase/supabase-js` - Supabase client library
- `vite` - Build tool and dev server

---

## 🔐 Environment Variables Required

### Backend (`.env` file in `backend/` directory)

```env
# Supabase
SUPABASE_SERVICE_KEY=your_service_role_key_here

# SMTP (Email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_16_char_app_password
SMTP_FROM="System Name <your_email@gmail.com>"

# SMS (Semaphore)
SEMAPHORE_API_KEY=your_semaphore_api_key
SMS_SENDER=SEMAPHORE

# Server
PORT=3001
```

---

## 📝 API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "reason": "Detailed error reason"
}
```

---

## 🔗 Useful Links

- **Supabase Dashboard**: https://supabase.com/dashboard
- **Semaphore API**: https://semaphore.co/
- **Gmail App Passwords**: https://myaccount.google.com/apppasswords
- **Nodemailer Documentation**: https://nodemailer.com/

---

## 📌 Notes

1. **Supabase Service Role Key**: Required for admin operations. Get it from Supabase Dashboard > Settings > API > service_role key (secret).

2. **Gmail App Passwords**: Required for SMTP. Generate from Google Account settings. Must be 16 characters.

3. **Semaphore API**: Philippine SMS gateway. Requires account registration and API key.

4. **CORS**: Backend allows all origins. Adjust `cors()` configuration in `server.js` for production.

5. **Port Configuration**: Default is 3001. Change via `PORT` environment variable.
