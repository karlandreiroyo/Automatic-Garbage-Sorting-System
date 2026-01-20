# Supabase Email Configuration

## The Error:
"Email service not configured" means Supabase's email service needs to be set up in your Supabase dashboard.

## How to Fix:

### Option 1: Use Supabase's Built-in Email (Recommended)

1. **Go to Supabase Dashboard:**
   - https://supabase.com/dashboard/project/aezdtsjycbsygqnsvkbz

2. **Navigate to Authentication:**
   - Click **Authentication** in the left sidebar
   - Go to **Settings** tab
   - Scroll to **Email Templates**

3. **Configure Email Provider:**
   - Supabase uses its own email service by default
   - Make sure "Enable email confirmations" is ON
   - Check that email sending is enabled

4. **Verify SMTP Settings (if using custom SMTP):**
   - Go to **Settings** → **Auth** → **SMTP Settings**
   - If you want to use your own email (Gmail, etc.), configure it here
   - Otherwise, Supabase's default email service should work

### Option 2: Check Email Templates

1. Go to **Authentication** → **Email Templates**
2. Make sure the "Reset Password" template is enabled
3. The template should be active and configured

### Option 3: Verify Project Settings

1. Go to **Settings** → **General**
2. Make sure your project is active
3. Check that email functionality is enabled

## After Configuration:

1. **Restart your backend:**
   ```powershell
   cd backend
   npm start
   ```

2. **Test password reset again**

## Note:

Supabase's `resetPasswordForEmail` function should work automatically if:
- Your Supabase project is active
- Email service is enabled in your project
- No custom SMTP configuration is blocking it

If you still see errors, check the backend console for the exact Supabase error message.
