# Email Verification Cooldown – Database Setup

After the **first** login with email verification, users can log out and log in again **within 1 week** without seeing the Email Verification screen; they go straight to the dashboard. Cooldown is **per email**: if you log in with your backup email for the first time, you must complete email verification once for that email; after that, that email also gets the 1-week cooldown.

**Both columns must exist and the backend must use the service_role key**, or the database will stay NULL and cooldown will not work.

## 1. Add columns in Supabase (required)

1. Open your project in the [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to **SQL Editor**.
3. Run this SQL (adjust the table name if yours is not `public.users`):

```sql
-- Cooldown: set when user completes email verification (enters 6-digit code)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS last_verified_at timestamptz;

-- Which email last verified (per-email cooldown: backup email must verify once too)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS last_verified_email text;

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
- **last_verified_at** and **last_verified_email** are set when the user enters the correct code and completes verification.
- On the next login within 1 week **with the same email** they verified with, the user goes **straight to the dashboard** (no Email Verification screen). Logging in with a different email (e.g. backup) requires verification for that email the first time.

## 3. (Optional) Force all users to do email verification once, then skip to dashboard on re-login

If you want **every user in the database** to go through the email verification screen on their next login, and then (after they verify and later log out) skip straight to the dashboard when they log in again, run this SQL **once** in the Supabase SQL Editor:

```sql
-- 1. Ensure the column exists (run this if you get "column last_verified_email does not exist")
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS last_verified_email text;

-- 2. Reset verification for all users so everyone must verify on next login.
-- After they verify once, they will skip to dashboard on re-login (within 1 week).
UPDATE public.users
SET last_verified_at = NULL,
    last_verified_email = NULL;
```

After you run it:
1. **All users** will see the Email Verification screen the next time they log in.
2. They enter the 6-digit code and complete login.
3. When they **log out** and **log in again** (within 1 week), they go **straight to the dashboard** (no verification step).
