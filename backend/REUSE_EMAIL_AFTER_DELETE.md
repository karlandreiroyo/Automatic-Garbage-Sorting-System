# Reusing an Email After Deleting a User

If you get **"A user with this email address has already been registered"** when creating an employee, it usually means that email is still in **Supabase Auth**, even if you deleted the row from your **database table**.

## Why this happens

- **Supabase Auth** (Authentication → Users) and your **`users` table** are separate.
- Deleting a row from the `users` table does **not** remove the user from Auth.
- Creating an employee adds a user in **both** Auth and your table. So to reuse an email, you must remove it from **Auth** as well.

## How to fix it (reuse the same email)

1. Open **[Supabase Dashboard](https://supabase.com/dashboard)** → your project.
2. Go to **Authentication** → **Users**.
3. Find the user with the email you want to reuse (e.g. search or scroll).
4. Open the user row and click **Delete** (or the trash icon).
5. Confirm deletion.
6. In your app, try **Create employee** again with that email.

After that, the email is free in Auth and the create-employee flow can succeed.
