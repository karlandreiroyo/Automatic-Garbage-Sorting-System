# Fix Email Notifications - App Password Removed

## Problem
Your Gmail App Password was removed on **January 21**, which is why you can no longer receive email notifications. Google sent you a security alert about this.

## Solution: Generate a New Gmail App Password

### Step 1: Enable 2-Step Verification (if not already enabled)
1. Go to https://myaccount.google.com/security
2. Under "Signing in to Google", check if "2-Step Verification" is ON
3. If OFF, click it and follow the setup process

### Step 2: Generate a New App Password
1. Go to https://myaccount.google.com/apppasswords
2. Sign in with your Gmail account (the one used in `SMTP_USER`)
3. Select "Mail" as the app
4. Select "Other (Custom name)" as the device
5. Type: "Garbage Sorting System" (or any name you prefer)
6. Click "Generate"
7. **Copy the 16-character password** (it will look like: `abcd efgh ijkl mnop`)
8. **Important:** Copy it immediately - you won't be able to see it again!

### Step 3: Update Your `.env` File
1. Open `backend/.env` in your code editor
2. Find the line: `SMTP_PASS=...`
3. Replace it with: `SMTP_PASS=your_new_16_character_app_password`
   - Remove any spaces from the password (the system does this automatically)
   - Example: `SMTP_PASS=abcdefghijklmnop`
4. Make sure `SMTP_USER` matches the Gmail account that generated the App Password
5. Save the file

### Step 4: Restart Your Backend Server
1. Stop the server (press `Ctrl+C` in the terminal)
2. Start it again:
   ```bash
   cd backend
   npm start
   ```

### Step 5: Test Email Sending
1. Try sending a test email (e.g., verify a phone number or create an employee account)
2. Check the terminal for success messages
3. Check your email inbox for the notification

## Verification
After updating, you should see in the terminal:
```
✅ Email sent successfully to: [email]
```

Instead of errors like:
```
❌ SMTP authentication failed
❌ Gmail authentication failed
```

## Important Notes
- **App Passwords are 16 characters** (without spaces)
- **Use the same Gmail account** for both `SMTP_USER` and the account that generates the App Password
- **App Passwords can be revoked** - if emails stop working again, check Google Security alerts
- **One App Password** can be used for all emails sent by your system

## Troubleshooting
If emails still don't work after updating:
1. Check the terminal for specific error messages
2. Verify `SMTP_USER` matches the Gmail account exactly
3. Ensure the App Password is exactly 16 characters (spaces are removed automatically)
4. Make sure 2-Step Verification is enabled on your Google account
5. Check if there are any new Google Security alerts
