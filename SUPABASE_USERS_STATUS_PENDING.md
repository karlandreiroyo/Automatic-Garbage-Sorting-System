# Set New Users Status to PENDING by Default

New accounts should start as **PENDING** until the user logs in and accepts terms (then they become ACTIVE).

---

## 1. Set the column default in Supabase

In **Supabase Dashboard → SQL Editor**, run:

```sql
-- Make PENDING the default for new rows (so any insert without status gets PENDING)
ALTER TABLE public.users
ALTER COLUMN status SET DEFAULT 'PENDING';
```

---

## 2. Remove any trigger that sets status to ACTIVE on insert

If new users still show as ACTIVE after the backend and default are set:

1. In **Supabase → Database → Triggers**, look for triggers on the **users** table.
2. If you see a trigger that runs on INSERT and sets `status` (e.g. to 'ACTIVE'), **drop or change it** so new rows stay PENDING.

To list triggers in SQL:

```sql
SELECT tgname, tgrelid::regclass
FROM pg_trigger
WHERE tgrelid = 'public.users'::regclass;
```

To drop a trigger (replace trigger_name and table name if different):

```sql
DROP TRIGGER IF EXISTS trigger_name ON public.users;
```

---

## 3. Backend behavior

The backend **create-employee** API explicitly sets `status: 'PENDING'` when inserting into `users`. After you:

- Set the default to PENDING (step 1), and  
- Remove any INSERT trigger that overrides status (step 2),

new accounts will stay PENDING until the user logs in and accepts terms (then the app sets status to ACTIVE).
