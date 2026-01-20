# 📧 Supabase Auth Email Configuration Guide

## Overview

This system uses **Supabase Auth's email infrastructure** to send verification emails. All emails are sent to the **currently authenticated user's email address** dynamically retrieved from their active session.

## Configuration Options

### Option 1: Configure SMTP in Supabase Dashboard (Recommended)

This is the recommended approach as it uses Supabase's built-in email infrastructure:

1. **Go to Supabase Dashboard:**
   - Navigate to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/auth
   - Click on **"SMTP Settings"** or **"Email"** section

2. **Configure SMTP:**
   - Enable **"Enable Custom SMTP"**
   - Enter your SMTP credentials:
     - **SMTP Host**: `smtp.gmail.com` (for Gmail)
     - **SMTP Port**: `587`
     - **SMTP User**: Your email address
     - **SMTP Password**: Your App Password (for Gmail)
     - **Sender Email**: Your email address
     - **Sender Name**: Your app name

3. **Update backend/.env:**
   ```env
   # Use the same SMTP credentials as configured in Supabase Dashboard
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   SMTP_FROM="Your App Name <your_email@gmail.com>"
   ```

### Option 2: Use Supabase's Default Email Service

If you don't configure custom SMTP, Supabase uses its default email service (limited to 2 emails per hour for testing).

## How It Works

1. **User Authentication:**
   - User logs in through Supabase Auth
   - System retrieves the authenticated user's email from the active session

2. **Email Sending:**
   - System generates a verification code
   - Email is sent to the authenticated user's email address
   - Uses SMTP configured in Supabase Dashboard (or local .env if Supabase SMTP not configured)

3. **Email Content:**
   - **Subject**: Action-specific (e.g., "Login Verification", "Change Password Verification")
   - **Body**: Includes action type, verification code, and expiration time
   - **Recipient**: Always the authenticated user's email (dynamically retrieved)

## Email Types

### 1. Login 2FA Verification
- **Action**: `LOGIN_VERIFICATION`
- **Subject**: "Login Verification"
- **Sent to**: Authenticated user's email from login session

### 2. Password Change Verification
- **Action**: `CHANGE_PASSWORD`
- **Subject**: "Change Password Verification"
- **Sent to**: Authenticated user's email from profile session

### 3. Password Reset Verification
- **Action**: `RESET_PASSWORD`
- **Subject**: "Reset Password Verification"
- **Sent to**: User's email from password reset request

## Backend Logging

All email sending is logged in the terminal with:
- ✅ User email (authenticated user's email)
- ✅ Action performed (LOGIN_VERIFICATION, CHANGE_PASSWORD, RESET_PASSWORD)
- ✅ Email subject
- ✅ Email send status (SUCCESS/FAILED)
- ✅ Verification code (for debugging)

## Important Notes

1. **No Hardcoded Emails:**
   - All recipient emails are dynamically retrieved from authenticated user sessions
   - Never uses hardcoded or default email addresses

2. **Supabase Integration:**
   - Emails use Supabase's configured SMTP when available
   - Falls back to local SMTP configuration if Supabase SMTP not configured
   - All emails go through Supabase's email infrastructure

3. **Consistency:**
   - Same email infrastructure used for all verification types
   - Consistent logging across all email operations
   - All emails include action type in subject and body

## Troubleshooting

### Emails Not Sending

1. **Check Supabase Dashboard:**
   - Verify SMTP is configured in Supabase Dashboard
   - Check Auth logs in Supabase Dashboard > Logs > Auth

2. **Check backend/.env:**
   - Ensure SMTP credentials match Supabase Dashboard configuration
   - Verify no placeholder values are used

3. **Check Terminal Logs:**
   - Look for email send status in terminal
   - Check for error messages with specific guidance

### Gmail Authentication Errors

If using Gmail:
1. Enable 2-Step Verification
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use the 16-character App Password (not your regular password)
4. Ensure SMTP_USER matches the email that generated the App Password

## Verification

To verify emails are being sent correctly:

1. **Check Terminal:**
   - Look for "✅ Status: Email sent successfully!" messages
   - Verify user email matches the authenticated user

2. **Check Supabase Dashboard:**
   - Go to Logs > Auth
   - Look for email sending events

3. **Check User's Email:**
   - User should receive email at their authenticated email address
   - Email subject should match the action performed
   - Email body should include the verification code
