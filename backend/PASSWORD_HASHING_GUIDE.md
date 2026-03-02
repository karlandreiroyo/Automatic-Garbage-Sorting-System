.# Password Hashing Guide (Supabase)

This guide explains how to store passwords as hashes in your database and how to fix old accounts that still have plain-text passwords. **Supabase** does not hash values for you inside the table; you hash in your app (or in a one-time script) and then store the hash.

---

## 1. Where passwords live

- **Supabase Auth (`auth.users`)**  
  Passwords for **login** are stored and hashed by Supabase Auth. You never see or store the real password there; Supabase handles hashing.

- **Your table (`public.users` → `pass_hash`)**  
  This column is **yours**. If you store the same password here (for display, sync, or legacy reasons), you should store only a **hash**, not the plain password. Your screenshot shows some rows already using **bcrypt** hashes (values starting with `$2a$06$`).

---

## 2. Hashing new passwords (going forward)

- **Do not** store plain passwords in `pass_hash`.
- **Do** hash the password in your **backend** (e.g. Node with `bcrypt`) before inserting or updating a row.
- **Algorithm:** Use **bcrypt** (cost factor 10 or 12). The `$2a$06$` in your DB is bcrypt with cost 6; 10 or 12 is stronger.
- **Flow:** When your app creates or updates a user, it should:
  1. Take the plain password.
  2. Hash it with bcrypt in the backend.
  3. Write the **hash** into `pass_hash` (and let Supabase Auth handle the real password for login).

So “hashing in the database” really means: **hash in the app, then store the result in the database.**

---

## 3. Hashing old accounts (migrating plain-text in `pass_hash`)

If some rows in `public.users` still have **plain text** in `pass_hash`, you need a **one-time migration** so that every value in `pass_hash` is a hash.

**Option A – Backend script (recommended)**  
- Write a small script (e.g. Node) that:
  1. Reads each row from `public.users` where `pass_hash` does **not** look like a hash (e.g. does not start with `$2a$` or `$2b$`).
  2. For each such row, hash `pass_hash` with bcrypt (same cost you use for new passwords).
  3. Update that row’s `pass_hash` with the new hash.
- Run the script once against your Supabase DB (using the same connection/API you use in the backend).  
- No need to change Supabase dashboard or table structure; you’re only updating column values.

**Option B – Supabase SQL + pgcrypto**  
- In Supabase, passwords are usually hashed in the app. If you really want to do it in the DB:
  1. In Supabase Dashboard go to **Database** → **Extensions**, enable **pgcrypto**.
  2. In **SQL Editor**, you can use `crypt()` and `gen_salt('bf')` to hash a value.  
- **Important:** To migrate existing plain-text values you must **update** rows: read the plain value, hash it, then `UPDATE users SET pass_hash = crypt(pass_hash, gen_salt('bf')) WHERE ...`.  
- Be very careful with SQL so you don’t double-hash (e.g. only run the update on rows where `pass_hash` does not start with `$2a$`).

**Option C – Manual / per user**  
- For a small number of users, you could reset their password in your app (so the app hashes the new password and writes it to `pass_hash`) and optionally in Supabase Auth (Authentication → Users → reset password). Then old plain-text in `pass_hash` is replaced by the new hash.

---

## 4. Identifying which rows need hashing

- **Already hashed:** Values that start with `$2a$` or `$2b$` (and often `$06$`, `$10$`, etc.) are bcrypt hashes. Leave them as they are; do **not** hash them again.
- **Need hashing:** Values that look like normal passwords (short, readable, no `$2a$` prefix) should be replaced by a bcrypt hash (via script or SQL as above).

---

## 5. Summary

| Goal | What to do |
|------|------------|
| **New passwords** | Hash in backend (e.g. bcrypt), then store only the hash in `pass_hash`. |
| **Old accounts with plain text in `pass_hash`** | One-time migration: script or SQL that hashes only those values and updates the same column. |
| **Supabase** | Use it for Auth (Supabase hashes Auth passwords). For `public.users.pass_hash`, you are responsible for only ever storing hashes, not plain passwords. |

If you tell me your backend language (e.g. Node) and whether you prefer a small script or SQL-only, I can outline exact steps (still as a guide, no direct code changes in your app if you prefer).
