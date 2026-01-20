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
