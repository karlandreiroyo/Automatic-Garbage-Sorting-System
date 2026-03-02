# Automatic Garbage Sorting System – Documentation

Single reference for setup, deployment, email, and hardware. Keep this file; the app does not depend on it at runtime.

---

## Table of contents

0. [**Step-by-step: Notifications on Railway (do this first)**](#0-step-by-step-notifications-on-railway-do-this-first)
1. [Project overview](#1-project-overview)
2. [Railway deployment](#2-railway-deployment)
3. [Backend & Supabase](#3-backend--supabase)
4. [Service role key (Supabase)](#4-service-role-key-supabase)
5. [Backend setup & start](#5-backend-setup--start)
6. [SMTP / Email (Gmail, Brevo)](#6-smtp--email-gmail-brevo)
7. [SMTP troubleshooting](#7-smtp-troubleshooting)
8. [Gmail App Password](#8-gmail-app-password)
9. [Email verification cooldown](#9-email-verification-cooldown)
10. [Supabase email config](#10-supabase-email-config)
11. [Update sender email / display name](#11-update-sender-email--display-name)
12. [SMS (Semaphore)](#12-sms-semaphore)
13. [Remember me (login table)](#13-remember-me-login-table)
14. [Reuse email after deleting user](#14-reuse-email-after-deleting-user)
15. [Frontend / Backend login service](#15-frontend--backend-login-service)
16. [Arduino hardware](#16-arduino-hardware)
17. [Raspberry Pi](#17-raspberry-pi)

---

## 0. Step-by-step: Notifications on Railway (do this first)

Follow these steps **one by one**. You do not need to change any code—only Railway and Supabase.

---

### Step 1: Get your Supabase service key

1. Open your browser and go to **https://supabase.com** → sign in.
2. Open the project that has your **AGSS Database** (the one where you see the `notification_bin` table).
3. In the left sidebar, click **Settings** (gear icon).
4. Click **API**.
5. On the API page, find **Project API keys**.
6. Find the key named **service_role** (not “anon”). Click **Reveal** or copy it. It is long and starts with `eyJ...`.
7. Copy that key and keep it somewhere safe (e.g. Notepad). You will use it in Step 3.

---

### Step 2: Get your Backend URL on Railway

1. Go to **https://railway.app** and sign in.
2. Open your project (e.g. “Automatic Garbage Sorting System” or “brave-adaptation”).
3. You should see at least two services: one for **Frontend** (React) and one for **Backend** (Node/Express). Click the **Backend** service.
4. Go to **Settings** (or the tab that has settings).
5. Find **Networking** or **Domains** (or **Generate domain**).
6. You will see a URL like `https://brave-adaptation-production.up.railway.app` or `https://something.up.railway.app`. That is your **Backend URL**.
7. Copy that full URL (no slash at the end) and keep it. You will use it in Step 4.

---

### Step 3: Put the Supabase key in the Backend on Railway

1. Still in Railway, in your **Backend** service, open the **Variables** tab (or **Environment** / **Env**).
2. Click **Add variable** or **New variable**.
3. **Name:** `SUPABASE_SERVICE_KEY`  
   **Value:** paste the **service_role** key you copied in Step 1.
4. Save. The backend may redeploy automatically; if not, use **Redeploy** or **Deploy** for the Backend service.
5. Wait until the deployment finishes (green / success).

---

### Step 4: Tell the Frontend where the Backend is

1. In Railway, click your **Frontend** service (the one that serves the website, not the backend).
2. Open the **Variables** tab.
3. Click **Add variable** or **New variable**.
4. **Name:** `VITE_API_URL`  
   **Value:** the **Backend URL** you copied in Step 2 (e.g. `https://brave-adaptation-production.up.railway.app`). No slash at the end.
5. Save.
6. **Important:** The frontend must **rebuild** so it uses this value. Click **Redeploy** or **Deploy** for the **Frontend** service and wait until it finishes.

---

### Step 5: Check that the Backend is working

1. Open a new browser tab.
2. In the address bar, type:  
   `https://YOUR-BACKEND-URL/api/health`  
   (Replace `YOUR-BACKEND-URL` with the same URL you used in Step 4, e.g. `brave-adaptation-production.up.railway.app`.)
3. Press Enter. You should see something like: `{"ok":true}`.  
   - If you see that, the backend is running. Go to Step 6.  
   - If you see an error or a blank page, the backend is not running or the URL is wrong. Check Step 2 and Step 3 and try again.

---

### Step 6: Open the app and check Notifications

1. Open your **Frontend** URL in the browser (e.g. `https://automatic-garbage-sorting-system-production.up.railway.app`).
2. Sign in as the **Collector** (e.g. KARL ANREI WEMBY ROYO).
3. In the left menu, click **Notifications**.
4. You should see the notifications from your `notification_bin` table (e.g. the “Drained” rows).  
   - If you still see “No notifications,” check the red error message at the top of the page (if any). It will say whether the problem is “Could not reach backend,” “Backend misconfigured,” or something else. Then repeat Step 3 (Supabase key) and Step 4 (VITE_API_URL) and redeploy both Backend and Frontend again.

---

**Summary**

| Step | Where        | What to set / do |
|------|--------------|-------------------|
| 1    | Supabase     | Copy **service_role** key |
| 2    | Railway      | Copy **Backend** URL |
| 3    | Railway Backend  | Variable: `SUPABASE_SERVICE_KEY` = service_role key → Redeploy backend |
| 4    | Railway Frontend | Variable: `VITE_API_URL` = Backend URL → Redeploy frontend |
| 5    | Browser      | Open Backend URL + `/api/health` → expect `{"ok":true}` |
| 6    | Browser      | Open app → Sign in → Notifications → should show DB data |

---

## 1. Project overview

- **Frontend:** React + Vite.
- **Backend:** Node.js + Express (e.g. `backend/server.js`).
- **Auth/DB:** Supabase (Auth + Postgres).
- **Deploy:** Railway (frontend + backend). Local: `VITE_API_URL=http://localhost:3001` for frontend to talk to local backend.

---

## 2. Railway deployment

Railway does **not** use your local `backend/.env`. Set variables in the **Railway Dashboard** per service.

**Quick fix for “Server returned an error page instead of JSON”**

1. **Backend URL:** Railway → backend service → **Settings** → **Networking** (or **Generate domain**). Copy full URL (e.g. `https://your-backend.up.railway.app`).
2. **Frontend:** Open frontend service → **Variables** → set **`VITE_API_URL`** = that backend URL (no trailing slash). The app uses `VITE_API_URL` at build time.
3. **Redeploy the frontend** so the new build includes the API URL.
4. **Check backend:** Open `https://<your-backend-url>/api/health` in browser; expect JSON like `{"ok":true}`.

**Frontend service (the one that serves the React app)**

- **Required for API and Notifications:** Add **`VITE_API_URL`** = your **backend** service public URL (e.g. `https://your-backend.up.railway.app`), no trailing slash. This is **not** the same as `FRONTEND_URL`. Then **redeploy the Frontend** so the build picks it up.
- **If you can’t set env vars on the frontend:** In `frontend/index.html`, uncomment the line that sets `window.__AGSS_BACKEND_URL__` and put your backend URL there, then redeploy the frontend.

**Backend service (the one that runs Node/Express)**

- **Required:** `SUPABASE_SERVICE_KEY` = Supabase **service_role** key (Settings → API) so it can read `notification_bin` and other tables.
- **Optional:** `FRONTEND_URL` = your frontend URL (e.g. `https://automatic-garbage-sorting-system.production.up.railway.app`) for CORS. You already have this; it does **not** tell the frontend where the backend is.
- **For email (Brevo):** `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`.
- Do **not** set `ARDUINO_PORT` on Railway (serial only for local).

---

## 3. Backend & Supabase

- Backend needs **Supabase Service Role Key** to read/update `users` and run admin operations.
- Get it: Supabase Dashboard → project → **Settings** → **API** → copy **service_role** (secret). Put in `backend/.env` as `SUPABASE_SERVICE_KEY=...`.
- Never commit `.env` or expose service_role in frontend.

---

## 4. Service role key (Supabase)

Replace placeholder `SUPABASE_SERVICE_KEY=your_service_role_key_here` in `backend/.env`:

1. Supabase Dashboard → project (e.g. `aezdtsjycbsygqnsvkbz`) → **Settings** → **API**.
2. Under “Project API keys”, copy the **service_role** key (long, starts with `eyJ...`). Do **not** use the anon key.
3. In `backend/.env` set `SUPABASE_SERVICE_KEY=<pasted_key>`.
4. Restart backend (`npm start`).

---

## 5. Backend setup & start

- **ERR_CONNECTION_REFUSED** usually means the backend is not running.

**Quick start**

1. `cd backend`
2. `npm install`
3. Create `backend/.env` with at least: `SUPABASE_SERVICE_KEY=...`, `PORT=3001`
4. `npm start` (or `npm run dev`)

**Optional: SMTP for verification emails**

- One sender account sends to all users (recipient comes from session). Example Gmail in `.env`:
  - `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`
  - `SMTP_USER=your_sender@gmail.com`, `SMTP_PASS=16_char_app_password`
  - `SMTP_FROM="System Name <your_sender@gmail.com>"`
- For Brevo: `SMTP_HOST=smtp-relay.brevo.com`, `SMTP_USER` = Brevo login email, `SMTP_PASS` = API key.
- If SMTP is not set, codes are still logged in the terminal.

**Gmail 535 error:** Use a **16-character App Password**, not your normal Gmail password. Enable 2-Step Verification, then create an App Password at https://myaccount.google.com/apppasswords (Mail, Other device “Backend Server”). Set `SMTP_USER` to the same Gmail that created the App Password.

---

## 6. SMTP / Email (Gmail, Brevo)

- **Gmail:** 2-Step Verification ON → App Password (16 chars) → `SMTP_USER` = that Gmail, `SMTP_PASS` = App Password.
- **Brevo:** `SMTP_HOST=smtp-relay.brevo.com`, `SMTP_PORT=587`, `SMTP_USER` = Brevo login email, `SMTP_PASS` = API key (SMTP & API → API Keys).
- **SMTP_FROM:** `"Display Name <sender@example.com>"`; address should match `SMTP_USER`.
- Do not use placeholder values; restart backend after changing `.env`.

---

## 7. SMTP troubleshooting

**Error 535 (Gmail):** Use App Password (16 chars), not regular password. Enable 2-Step Verification; `SMTP_USER` must match the account that created the App Password. Restart backend after editing `.env`.

**Common mistakes:** Regular password instead of App Password; `SMTP_USER` from different account than App Password; 2-Step Verification off; wrong/corrupted copy of App Password.

---

## 8. Gmail App Password

1. Enable 2-Step Verification: https://myaccount.google.com/security
2. App Password: https://myaccount.google.com/apppasswords → Mail → Other “Backend Server” → Generate → copy 16-character password.
3. In `backend/.env`: `SMTP_PASS=<16_char_password>` (spaces optional). `SMTP_USER` must be the Gmail that created it.
4. Restart backend. Optional: run `.\check-smtp-config.ps1` in backend to verify.

---

## 9. Email verification cooldown

After first login with email verification, users can skip the verification screen for a period (e.g. 3 hours) if the DB columns exist and backend uses service_role.

**In Supabase SQL Editor run:**

```sql
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_verified_at timestamptz;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS verification_sent_at timestamptz;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS second_email text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS second_email_verified boolean DEFAULT false;
```

Backend must use **service_role** key in `SUPABASE_SERVICE_KEY` and be restarted.

---

## 10. Supabase email config

- Emails go to the **authenticated user’s email** (from session); no hardcoded recipients.
- Subjects: “Login Verification”, “Change Password Verification”, “Reset Password Verification”.
- You can configure SMTP in Supabase Dashboard (Auth / Email) or rely on backend `.env` SMTP. Backend logs send status and verification codes.

---

## 11. Update sender email / display name

Edit `backend/.env`:

- **Sender account:** `SMTP_USER=new@example.com`, `SMTP_PASS` = App Password for that account.
- **Display name:** `SMTP_FROM="Display Name <new@example.com>"` (address must match `SMTP_USER`).

Restart backend. For Gmail, use an App Password for the new address.

---

## 12. SMS (Semaphore)

For password reset by **phone number**, add to `backend/.env`:

- `SEMAPHORE_API_KEY=your_semaphore_api_key`
- Optional: `SMS_SENDER=SEMAPHORE` (or approved sender name)

Restart backend. Reset by email still uses SMTP; by phone uses SMS when the key is set.

---

## 13. Notifications database (notification_bin)

Notifications are stored in Supabase in the **same project** you use locally, so when you deploy to Railway the app uses the same database and notifications appear in production.

- The backend reads/writes the **`notification_bin`** table (bin alerts, drain events, and read state).
- Run the migration in Supabase so the Notifications UI can mark items as read:
  1. Supabase Dashboard → **SQL Editor**.
  2. Run the contents of **`backend/scripts/add-notification-bin-is-read.sql`** (adds `is_read` column).
- If you haven’t already, run **`backend/scripts/add-notification-bin-columns.sql`** for `collector_id` and `bin_category`.
- On Railway, set **`SUPABASE_SERVICE_KEY`** (service_role key) in the backend service variables so the API can read/write `notification_bin`.

**Notifications empty on Railway (collector should see same as local)**  
1. **Backend service:** Set **`SUPABASE_SERVICE_KEY`** (Supabase service_role key). In **Settings → Networking**, copy your backend URL (e.g. `https://automatic-garbage-sorting-system-backend.up.railway.app`).  
2. **Frontend service:** In **Variables**, add **`VITE_API_URL`** = that backend URL (no trailing slash). **Redeploy the Frontend** (the variable is used at build time).  
3. **Alternative if you can’t set Frontend variables:** Edit `frontend/index.html`, uncomment the `<script>` line and set `window.__AGSS_BACKEND_URL__` to your backend URL, then commit and redeploy the frontend.  
4. Backend must be deployed with the latest code that reads `notification_bin`. CORS already allows your frontend origin.

---

## 14. Remember me (login table)

If you see **“Could not find the table 'public.remember_me_tokens'”** and Remember Me does not persist:

1. Supabase Dashboard → **SQL Editor**.
2. Run the contents of **`backend/supabase-remember-me-table.sql`** (creates `remember_me_tokens` and RLS policy).
3. Redeploy the Railway backend.

The frontend also uses localStorage as fallback so Remember Me can work before the table exists.

---

## 15. Reuse email after deleting user

“A user with this email address has already been registered” usually means the email still exists in **Supabase Auth** even if the row was deleted from your `users` table.

**Fix:** Supabase Dashboard → **Authentication** → **Users** → find the user → Delete. Then create the employee again with that email.

---

## 16. Frontend / Backend login service

The main app uses `backend/server.js`. There is also a small **backendlogin** server under `frontend/src/loginpage/backendlogin/server.js` (forgot-password-style endpoints, optional).

**Main backend:** `backend/` – `npm install`, set `.env` (e.g. `SUPABASE_SERVICE_KEY`, `PORT`, SMTP), then `npm start`. Default port 3001. Endpoints include `/api/health`, `/api/login`, `/api/remember-me`, `/api/forgot-password`, etc. See server and route files for full list.

---

## 17. Arduino hardware

- Sketch runs on **Arduino Uno**; sends waste type and weight over **serial (USB)**.
- Backend expects lines like: `RECYCABLE`, `NON_BIO`, `BIO`, `UNSORTED`, `Weight: X.X g`.
- **Conflict:** Serial Monitor and backend both need the same COM port – only one can use it. Close Serial Monitor when running the backend.
- In `backend/.env`: `ARDUINO_PORT=COM7` (or your port), `ARDUINO_BAUD=9600`. Start backend with `npm start`; use Collector Bin Monitoring in the app.

---

## 18. Raspberry Pi

- App in **raspberry/** sends sensor data to the backend: `POST API_URL/api/device/sensor` with `category`, `processing_time`, etc. Backend writes to Supabase `waste_items`.
- On Pi: copy `raspberry` folder, `npm install`, create `.env` with `API_URL=http://<PC_IP>:3001`, then `npm start`. Replace simulated data in `getSimulatedReading()` with real hardware/GPIO if needed.

---

*End of DOCS.md*
