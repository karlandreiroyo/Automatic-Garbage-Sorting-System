# Update Email Configuration

## Change Sender Email Account and Display Name

To change the email account that sends verification codes from `karlandreiroyo86@gmail.com` to `automaticgarbagesortingsystem1@gmail.com`, and customize the display name that appears in users' inboxes, you need to update the `backend/.env` file.

## Understanding SMTP_FROM Format:

The `SMTP_FROM` variable controls both:
- **Display Name**: The name that appears in the email (e.g., "Automatic Garbage Sorting System")
- **Email Address**: The sender's email address

**Format:** `"Display Name <email@example.com>"`

**Example:**
```env
SMTP_FROM="Automatic Garbage Sorting System <automaticgarbagesortingsystem1@gmail.com>"
```

In users' inboxes, this will show as:
- **From:** Automatic Garbage Sorting System
- **Email:** automaticgarbagesortingsystem1@gmail.com

## Steps:

1. **Open `backend/.env` file** in a text editor

2. **Find and update these two lines:**
   ```env
   SMTP_USER=automaticgarbagesortingsystem1@gmail.com
   SMTP_FROM="Automatic Garbage Sorting System <automaticgarbagesortingsystem1@gmail.com>"
   ```

3. **To Change the Display Name:**
   - Change the text before `<` in `SMTP_FROM`
   - Example: `SMTP_FROM="AGSS <automaticgarbagesortingsystem1@gmail.com>"` (shorter name)
   - Example: `SMTP_FROM="Garbage Sorting System <automaticgarbagesortingsystem1@gmail.com>"` (custom name)
   - The email address inside `< >` must match `SMTP_USER`

4. **Important Notes:**
   - Make sure `SMTP_USER` matches the email account that will generate the App Password
   - You'll need to generate a new App Password for `automaticgarbagesortingsystem1@gmail.com`
   - Update `SMTP_PASS` with the new 16-character App Password from the new email account
   - The email address in `SMTP_FROM` (inside `< >`) must match `SMTP_USER`

4. **Generate App Password for the new email:**
   - Go to: https://myaccount.google.com/apppasswords
   - Make sure 2-Step Verification is enabled on `automaticgarbagesortingsystem1@gmail.com`
   - Generate a new 16-character App Password
   - Update `SMTP_PASS` in `.env` with the new password

5. **Save the `.env` file**

6. **Restart the backend server:**
   ```powershell
   cd backend
   # Stop current server (Ctrl+C)
   npm start
   ```

## Complete .env Configuration Examples:

### Example 1: Keep "Automatic Garbage Sorting System" as display name
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=automaticgarbagesortingsystem1@gmail.com
SMTP_PASS=your_16_char_app_password_from_new_account
SMTP_FROM="Automatic Garbage Sorting System <automaticgarbagesortingsystem1@gmail.com>"
```

### Example 2: Use a shorter display name (e.g., "AGSS")
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=automaticgarbagesortingsystem1@gmail.com
SMTP_PASS=your_16_char_app_password_from_new_account
SMTP_FROM="AGSS <automaticgarbagesortingsystem1@gmail.com>"
```

### Example 3: Use a custom display name
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=automaticgarbagesortingsystem1@gmail.com
SMTP_PASS=your_16_char_app_password_from_new_account
SMTP_FROM="Your Custom Name <automaticgarbagesortingsystem1@gmail.com>"
```

**Note:** Replace `Your Custom Name` with whatever display name you want users to see in their inbox.

## Verify Configuration:

Run the check script to verify:
```powershell
cd backend
.\check-smtp-config.ps1
```

You should see all [OK] messages.
