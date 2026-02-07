# Bin "Last Collection" – Supabase Setup

The **Last Collection** value on bin cards now comes from your Supabase database (no more "X minutes ago"). It uses the `last_update` column on the `bins` table.

---

## 1. Add the column (if it doesn’t exist)

In the **Supabase Dashboard** go to **SQL Editor** and run:

```sql
-- Add last_update column to bins (timestamp of last collection/drain)
ALTER TABLE bins
ADD COLUMN IF NOT EXISTS last_update TIMESTAMPTZ DEFAULT NULL;
```

---

## 2. (Optional) Set initial values for existing bins

To give existing bins a value instead of "—":

```sql
-- Set last_update to now for all bins that don’t have it
UPDATE bins
SET last_update = NOW()
WHERE last_update IS NULL;
```

---

## 3. How it’s used

- **On load:** Bin monitoring reads `last_update` and shows it as a date/time (e.g. `Dec 15, 2024, 2:30 PM`). If `last_update` is `NULL`, it shows "—".
- **On drain:** When a bin is drained, the app updates `last_update` to the current time, so the card shows the new collection time.

No "minutes ago" text is used; only the stored date/time is displayed.
