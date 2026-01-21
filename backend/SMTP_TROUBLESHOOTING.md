# 🔧 SMTP Troubleshooting Guide

## Quick Fix for Gmail Authentication Error (535)

If you see: `535-5.7.8 Username and Password not accepted`

### ✅ Step-by-Step Fix:

1. **Check your current SMTP_USER in `backend/.env`:**
   ```env
   SMTP_USER=your_email@gmail.com
   ```
   - Must be a valid Gmail address
   - Must match the account that will generate the App Password

2. **Enable 2-Step Verification:**
   - Go to: https://myaccount.google.com/security
   - Turn ON "2-Step Verification"
   - Wait for it to activate (may take a few minutes)

3. **Generate App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" → "Other (Custom name)"
   - Name it: "Backend Server"
   - Click "Generate"
   - **Copy the 16-character password** (it looks like: `abcd efgh ijkl mnop`)

4. **Update `backend/.env`:**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_exact_email@gmail.com
   SMTP_PASS=abcdefghijklmnop
   SMTP_FROM="Your Name <your_exact_email@gmail.com>"
   ```
   
   **Important:**
   - `SMTP_USER` must EXACTLY match the email that generated the App Password
   - `SMTP_PASS` is the 16-character App Password (spaces are OK, will be removed automatically)
   - No quotes around `SMTP_PASS` (unless it contains special characters)

5. **Restart the backend:**
   ```powershell
   cd backend
   npm start
   ```

## Common Mistakes ❌

1. **Using regular Gmail password instead of App Password**
   - ❌ Wrong: `SMTP_PASS=your_regular_password`
   - ✅ Right: `SMTP_PASS=abcdefghijklmnop` (16-char App Password)

2. **SMTP_USER doesn't match the App Password account**
   - ❌ Wrong: App Password from `account1@gmail.com` but `SMTP_USER=account2@gmail.com`
   - ✅ Right: `SMTP_USER` must match the account that generated the App Password

3. **2-Step Verification not enabled**
   - ❌ Wrong: Trying to use App Password without 2-Step Verification
   - ✅ Right: Enable 2-Step Verification first, then generate App Password

4. **Copying App Password incorrectly**
   - ❌ Wrong: Including extra spaces or characters
   - ✅ Right: Copy exactly the 16 characters (spaces are OK, system removes them)

5. **Using expired or revoked App Password**
   - ❌ Wrong: Using an old App Password that was deleted
   - ✅ Right: Generate a fresh App Password

## Verify Your Configuration

After updating `.env`, check the terminal when you start the backend:

✅ **Good signs:**
- No SMTP warnings on startup
- Email sends successfully

❌ **Bad signs:**
- Warning about placeholder values
- Warning about invalid email format
- Error 535 when sending email

## Still Not Working?

1. **Double-check your `.env` file:**
   - Open `backend/.env` in a text editor
   - Verify each value is correct
   - Make sure there are no extra quotes or spaces

2. **Test with a new App Password:**
   - Delete the old App Password
   - Generate a completely new one
   - Update `SMTP_PASS` in `.env`
   - Restart backend

3. **Verify email format:**
   - `SMTP_USER` must be: `something@gmail.com`
   - Not: `something@example.com` (if using Gmail)
   - Not: `something` (missing @gmail.com)

4. **Check terminal output:**
   - The error message now shows your current `SMTP_USER`
   - It shows the password length
   - Use this info to verify your configuration

## Need Help?

Check the terminal error message - it now includes:
- Your current `SMTP_USER` value
- Your password length
- Step-by-step fix instructions

Follow the instructions in the error message exactly.
