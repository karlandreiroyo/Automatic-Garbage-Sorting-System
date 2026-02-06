# Terms and Conditions Acceptance - Database Setup

When an **ADMIN** or **COLLECTOR** logs in for the first time, they will be required to accept the Terms and Conditions before accessing the dashboard.

## Database Setup

You need to add a column to track when users have accepted the terms.

### 1. Add `terms_accepted_at` column in Supabase

1. Open your project in the [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to **SQL Editor**.
3. Run this SQL:

```sql
-- Track when user accepted Terms and Conditions
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz;
```

4. Click **Run**.

### 2. Column Details

- **Column Name:** `terms_accepted_at`
- **Type:** `timestamptz` (timestamp with timezone)
- **Nullable:** Yes (NULL means terms not accepted yet)
- **Default:** NULL

### 3. How It Works

1. **First Login Flow:**
   - User logs in with email/password
   - User completes 2FA verification
   - System checks `terms_accepted_at` field
   - If NULL and role is ADMIN or COLLECTOR → Shows Terms and Conditions modal
   - User must scroll to bottom and click "Accept"
   - `terms_accepted_at` is set to current timestamp
   - User is redirected to their dashboard

2. **Subsequent Logins:**
   - If `terms_accepted_at` is not NULL → User goes directly to dashboard
   - Terms modal is not shown again

3. **Roles Affected:**
   - ✅ **ADMIN** - Must accept terms on first login
   - ✅ **COLLECTOR** - Must accept terms on first login
   - ❌ **SUPERVISOR** - No terms required
   - ❌ **SUPERADMIN** - No terms required

### 4. Verification

After running the SQL, you can verify the column exists:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'terms_accepted_at';
```

You should see:
- `column_name`: `terms_accepted_at`
- `data_type`: `timestamp with time zone`
- `is_nullable`: `YES`

## Notes

- Existing users will have `NULL` in this field, so they will see terms on their next login
- The terms acceptance is stored permanently - once accepted, users won't see it again
- If you need to force users to re-accept terms (e.g., after updating terms), you can set their `terms_accepted_at` to NULL
