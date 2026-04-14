# SETUP GUIDE: Supabase Service Key + Brevo SMTP Email Configuration

## Issue 1: Configure Supabase Service Key

### Step 1: Get Your Supabase Service Role Key
1. Go to your **Supabase Dashboard**: https://supabase.com/dashboard/projects
2. Click on your project
3. Go to **Settings** (bottom-left menu) → **API**
4. Find the **service_role** key (it's different from the anon key)
5. Click **"Reveal"** to see the full key
6. Copy the entire key (it will be very long, starting with `eyJhbGc...`)

### Step 2: Add to backend/.env
```
SUPABASE_SERVICE_KEY=your_service_role_key_here_paste_the_long_key
```

⚠️ Important:
- Use the **service_role** key, NOT the anon key
- This key allows admin operations and bypasses Row Level Security (RLS)
- Keep it secret - only on your Railway environment

---

## Issue 2: Configure Brevo SMTP for Email Verification

### Step 1: Get Your Brevo SMTP API Key

**Method 1: Brevo Dashboard (Recommended)**
1. Go to https://app.brevo.com/
2. Login with your Brevo account
3. In the left sidebar, click **SMTP & API**
4. Click **API Keys** tab
5. You'll see your API keys listed
   - If you don't have one, click **"Create a new API key"**
   - Give it a name like: `"MyApp-SMTP"`
   - Select scope: **"Send transactional email"**
6. Copy the key (it starts with `xkeysib-`)

**Method 2: Using Brevo Website Form**
1. Go to https://www.brevo.com/
2. Click **Login** in top-right
3. Login with your account email and password
4. Same steps as above (SMTP & API → API Keys)

### Step 2: Verify a Sender Email in Brevo

Before sending emails, you must verify the "From" email address:

1. In **Brevo Dashboard**, go to **SMTP & API**
2. Click **Sender Emails** tab
3. Click **"Add a sender email"**
4. Enter the email you want to send from (e.g., `noreply@mycompany.com` or `support@mycompany.com`)
5. Check the email for a verification link
6. Click the verification link to confirm

⚠️ Important: Only **verified sender emails** can send via Brevo SMTP

### Step 3: Configure backend/.env

Fill in your `backend/.env` file with:

```dotenv
# Brevo SMTP Configuration
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your_brevo_account_email@gmail.com
SMTP_PASS=xkeysib-your_api_key_here
SMTP_FROM="MyApp <verified@youremail.com>"
BREVO_API_KEY=xkeysib-your_api_key_here
```

**Detailed breakdown:**
- `SMTP_HOST`: Always use `smtp-relay.brevo.com`
- `SMTP_PORT`: Always use `587` (TLS)
- `SMTP_USER`: Your Brevo account email (the one you use to login)
- `SMTP_PASS`: Your API key from Brevo Dashboard (starts with `xkeysib-`)
- `SMTP_FROM`: The verified sender email format: `"App Name <verified@email.com>"`
- `BREVO_API_KEY`: Same as `SMTP_PASS`

### Step 4: Verify Configuration

Run this command to test your SMTP connection:

```bash
curl -X POST http://localhost:3000/api/shared/verify-smtp \
  -H "Content-Type: application/json" \
  -d '{"testEmail":"your_test_email@gmail.com"}'
```

Expected response:
```json
{"ok": true, "message": "SMTP connection successful"}
```

---

## How the Email Verification Works

### Flow:
1. **User requests login verification code** → `/api/shared/send-verification`
2. **Backend checks**: Does this user exist in Supabase? 
   - If YES → Continue with Step 3
   - If NO → Return error "User not found"
3. **Backend generates 6-digit code** and stores it
4. **Backend sends verification email via Brevo SMTP** with the code
5. **User receives email** with the code
6. **User submits code** → `/api/shared/verify-code`
7. **Backend validates code** and logs in user

### Code Locations:
- **User existence check**: `backend/utils/mailer.js` → `checkUserExistsInSupabase()`
- **Email sending**: `backend/utils/mailer.js` → `sendLoginVerificationEmail()`
- **Route**: `backend/routes/shared/loginVerification.js` → `POST /send-verification`

---

## Environment Variables Summary

Your complete `backend/.env` should now have:

```dotenv
# Arduino Configuration
ARDUINO_PORT=/dev/ttyUSB0

# Backend Server
BACKEND_URL=https://automatic-garbage-sorting-system-production.up.railway.app

# Supabase Configuration
SUPABASE_SERVICE_KEY=your_service_role_key_here

# Brevo SMTP Configuration
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your_brevo_email@gmail.com
SMTP_PASS=xkeysib-your_brevo_api_key
SMTP_FROM="MyApp <verified@youremail.com>"
BREVO_API_KEY=xkeysib-your_brevo_api_key
```

---

## Troubleshooting

### Problem: "SUPABASE_SERVICE_KEY not configured"
- ✅ Go to Supabase Dashboard > Settings > API > Reveal the service_role key
- ✅ Copy the full key into `backend/.env`
- ✅ Restart the backend server

### Problem: "Brevo SMTP authentication failed (535 error)"
- ✅ Check `SMTP_USER` is your Brevo **account email**, not just any email
- ✅ Check `SMTP_PASS` starts with `xkeysib-` (it's the API key, not your password)
- ✅ Use `SMTP_HOST=smtp-relay.brevo.com` and `SMTP_PORT=587`

### Problem: "email not verified" error from Brevo
- ✅ Go to Brevo Dashboard > SMTP & API > Sender Emails
- ✅ Make sure the email in `SMTP_FROM` is listed and marked as "Verified"
- ✅ If not verified, you'll receive a verification email - click the link

### Problem: "User not found" when trying to login
- ✅ This is correct behavior - the user doesn't exist in your Supabase database
- ✅ Make sure the user is registered in Supabase users table first
- ✅ Check the email matches exactly (lowercase, no spaces)

---

## Security Notes

⚠️ **Never commit .env to Git** - Use `.gitignore` to exclude it  
⚠️ **Keep secrets safe** - Use Railway's environment variables for production  
⚠️ **Use service role key only on backend** - Never expose it to frontend  
⚠️ **Verify sender emails** - Brevo requires email verification for compliance
