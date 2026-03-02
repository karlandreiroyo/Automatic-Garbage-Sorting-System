# 🔑 How to Get Your Service Role Key

## The Problem:
Your `.env` file currently has:
```
SUPABASE_SERVICE_KEY=your_service_role_key_here
```

This placeholder won't work! You need to replace it with your actual key.

## Steps to Get Your Service Role Key:

1. **Go to Supabase Dashboard:**
   - Open: https://supabase.com/dashboard
   - Sign in to your account

2. **Select Your Project:**
   - Click on your project: `aezdtsjycbsygqnsvkbz`

3. **Go to Settings:**
   - In the left sidebar, click **Settings** (gear icon)

4. **Click on API:**
   - Under "Configuration", click **API**

5. **Find Service Role Key:**
   - Scroll down to "Project API keys"
   - Find the **`service_role`** key
   - It's labeled as **"secret"** and is very long (starts with `eyJ...`)
   - **DO NOT use the `anon` key** - you need the `service_role` key!

6. **Copy the Key:**
   - Click the "eye" icon or "copy" button next to `service_role`
   - The key will look like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlemR0c2p5Y2JzeWdxbnN2a2J6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjcyOTgxMSwiZXhwIjoyMDgyMzA1ODExfQ.XXXXX...`

7. **Update Your .env File:**
   - Open the `backend/.env` file in your editor
   - Replace `your_service_role_key_here` with the actual key you copied
   - Save the file

8. **Restart Backend:**
   ```powershell
   cd backend
   npm start
   ```

## Security Warning:
⚠️ **NEVER share this key or commit it to Git!** 
- The service_role key has full database access
- Keep it secret and only in your `.env` file

## Verify It's Working:
After updating and restarting, when you try password reset, you should see in the backend console:
- ✅ "Searching for user with email: ..."
- ✅ "User found with exact match: ..."

Instead of:
- ❌ "User lookup failed"
- ❌ "Available emails in database: none"
