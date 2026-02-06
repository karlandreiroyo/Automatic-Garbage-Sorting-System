# Terms and Conditions Setup Guide - For Beginners

This guide will help you set up the Terms and Conditions feature for first-time login. **Don't worry if you're a beginner - I'll explain everything step by step!**

## 📋 What You Need to Do

You only need to add **ONE column** to your existing `users` table in Supabase. That's it!

## 🗄️ Database Setup (Step-by-Step)

### Step 1: Open Supabase Dashboard

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Click on your project (the one you're using for this system)

### Step 2: Open SQL Editor

1. In the left sidebar, look for **"SQL Editor"** (it has a database icon)
2. Click on it
3. You'll see a text area where you can type SQL commands

### Step 3: Add the Column

1. Copy and paste this SQL code into the SQL Editor:

```sql
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz;
```

2. Click the **"Run"** button (usually at the bottom right or top right)
3. You should see a success message like "Success. No rows returned"

### Step 4: Verify It Worked

1. In the left sidebar, click **"Table Editor"**
2. Find and click on the **"users"** table
3. Look at the columns - you should now see a new column called **"terms_accepted_at"**
4. It should be empty (NULL) for all existing users - that's normal!

## ✅ That's It!

You're done! The column is now added to your database.

## 🔍 What This Column Does

- **Column Name:** `terms_accepted_at`
- **Type:** `timestamptz` (timestamp with timezone - stores date and time)
- **What it stores:** The date and time when a user accepted the terms
- **NULL value:** Means the user hasn't accepted terms yet (first-time login)
- **Has a value:** Means the user already accepted terms (won't see modal again)

## 🎯 How It Works

### First Time Login:
1. User logs in → Enters email/password
2. 2FA Verification → User enters 6-digit code
3. User lands on dashboard → Terms modal automatically appears
4. User scrolls to bottom of terms → "Accept" button becomes enabled
5. User clicks "Accept" → `terms_accepted_at` is saved with current date/time
6. User can now use the dashboard

### Second Time (and all future logins):
1. User logs in → Enters email/password
2. 2FA Verification → User enters 6-digit code
3. User lands on dashboard → **No terms modal** (because `terms_accepted_at` has a value)
4. User can use dashboard immediately

## 🎨 Who Sees Terms?

- ✅ **ADMIN** - Must accept terms on first login
- ✅ **COLLECTOR** - Must accept terms on first login
- ❌ **SUPERVISOR** - No terms required
- ❌ **SUPERADMIN** - No terms required

## 🐛 Troubleshooting

### Problem: "Column already exists" error
**Solution:** That's okay! It means the column is already there. You can ignore this error.

### Problem: Can't find "SQL Editor"
**Solution:** Make sure you're logged into Supabase and have selected the correct project.

### Problem: "Permission denied" error
**Solution:** Make sure you're the project owner or have admin access to the database.

### Problem: Terms modal not showing
**Solution:** 
1. Check if the column exists in the users table
2. Make sure the user's `terms_accepted_at` is NULL (empty)
3. Make sure the user's role is ADMIN or COLLECTOR

## 📝 Notes

- **Existing users:** All existing users will have `NULL` in this column, so they'll see terms on their next login
- **New users:** New users created after this setup will also have `NULL` until they accept
- **Force re-acceptance:** If you need to make users accept terms again (e.g., after updating terms), you can set their `terms_accepted_at` to NULL in the database

## 🎉 You're All Set!

Once you've added the column, the system will automatically:
- Show terms modal to first-time ADMIN and COLLECTOR users
- Save their acceptance timestamp
- Never show the modal again after acceptance

No other changes needed - everything else is already set up in the code!
