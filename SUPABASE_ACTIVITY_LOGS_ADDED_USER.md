# Activity Logs – Collector ID Column (added_user_id)

Recent Activity in the Admin Dashboard shows: **"Admin (name from users) Added (collector full name)"**.

- **Admin name** comes from `activity_logs.user_id` → lookup in `public.users` (first_name, last_name, middle_name).
- **Collector name** comes from a new column `added_user_id` → lookup in `public.users` (the new employee who was added).

---

## Add the column in Supabase

In **Supabase Dashboard → SQL Editor**, run:

```sql
-- Column to store the id of the collector (new employee) who was added
ALTER TABLE activity_logs
ADD COLUMN IF NOT EXISTS added_user_id INTEGER REFERENCES users(id);
```

That creates the column and a foreign key to `users(id)` so the dashboard can join and fetch the collector’s full name from `public.users`.

---

## Behavior

- When an admin adds a collector, the backend stores:
  - `user_id` = admin who performed the action (from `performed_by_user_id`).
  - `added_user_id` = id of the new collector row in `public.users`.
- The dashboard loads activity with joins:
  - `user_id` → `users` (actor/admin) for admin name.
  - `added_user_id` → `users` (collector) for collector full name.
- Display format: **"Admin {admin full name} Added {collector full name}"**.
