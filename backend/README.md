# Backend Login Service

Backend service for handling forgot password functionality using Node.js and Express.

## ⚠️ IMPORTANT: Setup Service Role Key

**The backend requires a Supabase Service Role Key to access the users table.**

### How to Get Your Service Role Key:

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Find **Project API keys**
5. Copy the **`service_role`** key (⚠️ Keep this secret! Never expose it in frontend code)

### Setup:

1. Create a `.env` file in the `backend` folder:
```bash
PORT=3001
SUPABASE_SERVICE_KEY=your_service_role_key_here
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will run on `http://localhost:3001` by default.

## Why Service Role Key?

- The backend needs to read the `users` table to verify emails
- It needs to update user passwords (admin operation)
- The anon key has RLS (Row Level Security) restrictions
- The service_role key bypasses RLS for admin operations

## Security Note

⚠️ **NEVER commit the `.env` file or expose the service_role key in frontend code!**
- The service_role key has full database access
- Only use it in secure backend environments
- Keep it in `.env` file (which is in `.gitignore`)
