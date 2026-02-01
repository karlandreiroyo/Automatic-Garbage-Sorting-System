# Email Verification Cooldown – Database Setup

After the **first** login with email verification, users can log out and log in again **within 3 hours** without seeing the Email Verification screen; they go straight to the dashboard.

**Both columns must exist and the backend must use the service_role key**, or the database will stay NULL and cooldown will not work.

## 1. Add columns in Supabase (required)

1. Open your project in the [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to **SQL Editor**.
3. Run this SQL (adjust the table name if yours is not `public.users`):

```sql
-- Cooldown: set when user completes email verification (enters 6-digit code)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS last_verified_at timestamptz;

-- When the verification email was sent (for tracking)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS verification_sent_at timestamptz;

-- Backup (second) email and its verification status (for "login with backup email")
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS second_email text;
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS second_email_verified boolean DEFAULT false;
```

4. Click **Run**.

## 2. Use the service_role key in the backend (required)

The backend must use the **service_role** key to update `users`. With the anon key, RLS can block updates and both columns stay NULL.

1. In Supabase: **Settings → API**.
2. Copy the **service_role** key (secret).
3. In `backend/.env` set:
   ```
   SUPABASE_SERVICE_KEY=your_service_role_key_here
   ```
4. Restart the backend (`npm start`).

After this:
- **verification_sent_at** is set when the backend sends the 6-digit code email (login → verify screen).
- **last_verified_at** is set when the user enters the correct code and completes verification.
- On the next login within 3 hours, the user goes **straight to the dashboard** (no Email Verification screen).
