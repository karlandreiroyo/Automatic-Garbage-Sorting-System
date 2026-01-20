# 🚀 Backend Setup Instructions

## The Error You're Seeing:
`ERR_CONNECTION_REFUSED` means the backend server is not running.

## Quick Fix - Start the Backend:

1. **Open a NEW terminal/PowerShell window**

2. **Navigate to backend folder:**
   ```powershell
   cd backend
   ```

3. **Install dependencies (if not done):**
   ```powershell
   npm install
   ```

4. **Create .env file with your Service Role Key:**
   
   Create a file named `.env` in the `backend` folder with this content:
   ```
   SUPABASE_SERVICE_KEY=your_service_role_key_here
   PORT=3001
   ```

## Optional (Recommended) - Configure SMTP for Email Notifications
To send verification emails with proper subjects (Login Verification, Change Password Verification, Reset Password Verification), configure SMTP.

**✅ IMPORTANT:** The system automatically sends emails to each user's email address (dynamically retrieved from their session). You only need ONE sender account that will send emails to ALL users.

### Understanding SMTP Configuration:
- **SMTP_USER**: The sender email account (ONE account for the entire system)
- **SMTP_PASS**: The sender account's password/app password
- **SMTP_FROM**: The "From" name/address shown in emails
- **Recipient Email**: Automatically determined from the logged-in user's session (different for each user)

**Example:** If you configure `SMTP_USER=admin@company.com`, this ONE account will send verification emails to:
- `user1@example.com` (when user1 logs in)
- `user2@example.com` (when user2 logs in)
- `karlandreiroyo86@gmail.com` (when that user logs in)
- And so on for ALL users in your system

### For Gmail:
1. Enable 2-Step Verification on your Google account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Add these to `backend/.env`:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_sender_email@gmail.com
SMTP_PASS=your_16_digit_app_password
SMTP_FROM="System Name <your_sender_email@gmail.com>"
```

**Example Configuration:**
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=notifications@yourcompany.com
SMTP_PASS=abcd efgh ijkl mnop
SMTP_FROM="Automatic Garbage Sorting System <notifications@yourcompany.com>"
```

### For Other Email Providers:
- **Outlook/Hotmail**: `SMTP_HOST=smtp-mail.outlook.com`, `SMTP_PORT=587`
- **Yahoo**: `SMTP_HOST=smtp.mail.yahoo.com`, `SMTP_PORT=587`
- **Custom SMTP**: Use your provider's SMTP settings

**⚠️ DO NOT use placeholder values like:**
- ❌ `SMTP_HOST=your_smtp_host`
- ❌ `SMTP_USER=your_actual_email@gmail.com` (use your actual sender email)
- ❌ `SMTP_PASS=your_16_digit_app_password_here` (use your actual app password)

After updating `.env`, restart the backend:
```powershell
npm start
```

**Note:** If SMTP is not configured, verification codes will still be visible in the terminal for testing.

### Troubleshooting Gmail Authentication Errors:

If you see error `535-5.7.8 Username and Password not accepted`:

1. **Verify 2-Step Verification is enabled:**
   - Go to: https://myaccount.google.com/security
   - Make sure "2-Step Verification" is ON

2. **Generate a new App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter "Backend Server" as the name
   - Copy the 16-character password (it may have spaces - that's OK)

3. **Check your .env file:**
   ```env
   SMTP_USER=your_actual_email@gmail.com  # Must match the account that generated the App Password
   SMTP_PASS=abcd efgh ijkl mnop          # The 16-character App Password (spaces are OK)
   ```

4. **Common mistakes:**
   - ❌ Using your regular Gmail password instead of App Password
   - ❌ Using an App Password from a different Google account
   - ❌ Copying the App Password with extra spaces or characters
   - ❌ SMTP_USER doesn't match the account that generated the App Password

5. **Test your App Password:**
   - Remove any spaces from the App Password in .env (or keep them - both work)
   - Make sure there are no quotes around the App Password
   - Restart the backend server after making changes

6. **Still not working?**
   - Generate a new App Password and try again
   - Make sure you're using the email that has 2-Step Verification enabled
   - Check that SMTP_USER exactly matches the email address (case-sensitive)
   
   **To get your Service Role Key:**
   - Go to https://supabase.com/dashboard
   - Select your project
   - Go to **Settings** → **API**
   - Copy the **`service_role`** key (it's the long one labeled "secret")
   - Replace `your_service_role_key_here` with your actual key

5. **Start the backend server:**
   ```powershell
   npm start
   ```
   
   You should see:
   ```
   Backend login server running on port 3001
   Health check: http://localhost:3001/api/health
   ```

6. **Keep this terminal open** - the backend must keep running!

## Now Try Again:
- Go back to your browser
- Try the password reset again
- It should work now! ✅

## Troubleshooting:
- If you see "WARNING: SUPABASE_SERVICE_KEY not found" → Make sure the `.env` file exists and has the correct key
- If port 3001 is already in use → Change PORT in `.env` to a different number (like 3002)
