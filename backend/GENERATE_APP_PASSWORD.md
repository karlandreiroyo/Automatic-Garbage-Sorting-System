# 🔐 Generate Gmail App Password - Step by Step

## Quick Steps:

1. **Enable 2-Step Verification** (if not already enabled):
   - Go to: https://myaccount.google.com/security
   - Turn ON "2-Step Verification"
   - Wait for it to activate

2. **Generate App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - You'll see a page with two dropdowns:
     - **Select app**: Choose **"Mail"**
     - **Select device**: Choose **"Other (Custom name)"**
   - Type: **"Backend Server"** in the text box
   - Click **"Generate"**
   - **Copy the 16-character password** that appears
     - It will look like: `abcd efgh ijkl mnop` (with or without spaces)

3. **Update backend/.env**:
   - Open `backend/.env` in a text editor
   - Find the line: `SMTP_PASS=your_16_char_app_password_here`
   - Replace it with: `SMTP_PASS=abcdefghijklmnop`
     - Remove spaces from the App Password (or keep them - both work)
     - Example: If Google shows `abcd efgh ijkl mnop`, use `abcdefghijklmnop` or `abcd efgh ijkl mnop`

4. **Restart Backend**:
   ```powershell
   # Stop current server (Ctrl+C), then:
   cd backend
   npm start
   ```

5. **Verify**:
   - Run the check script again: `.\check-smtp-config.ps1`
   - It should now show: `[OK] Password length is correct (16 characters)`

## Important Notes:

- ✅ The App Password is exactly 16 characters (spaces don't count)
- ✅ Use the App Password, NOT your regular Gmail password
- ✅ Make sure `SMTP_USER` matches the email that generated the App Password
- ✅ After updating `.env`, always restart the backend server
