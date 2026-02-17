# Run this in Supabase (not in your app code)

This SQL runs **once** in the **Supabase website** so that Admin users can read the `notification_bin` table and the dashboard can show the correct "Total Collection (bins drained)" count.

---

## Where to run it

1. Open your browser and go to **[https://supabase.com](https://supabase.com)**.
2. Log in and open your project (AGSS Database).
3. In the left sidebar, click **SQL Editor**.
4. Click **New query**.
5. Paste the SQL below into the editor.
6. Click **Run** (or press Ctrl+Enter).

That’s it. You do **not** run this in your project folder, terminal, or VS Code.

---

## SQL to paste and run

```sql
-- Allow admins/superadmins to read notification_bin (for Total Collection count)
alter table public.notification_bin enable row level security;

drop policy if exists "Admins can read notification_bin" on public.notification_bin;
create policy "Admins can read notification_bin"
on public.notification_bin
for select
to authenticated
using (
  exists (
    select 1 from public.users
    where users.auth_id = auth.uid()
    and users.role in ('ADMIN', 'SUPERADMIN')
  )
);
```

---

## After you run it

- Refresh your Admin dashboard in the app.
- "Total Collection (bins drained)" should show the real count of rows where `status = 'Drained'` in `notification_bin`.
