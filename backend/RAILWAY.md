# Railway deployment – set these variables

Railway does **not** use your local `backend/.env` file. Add variables in the **Railway Dashboard** per service.

Your app is at **https://automatic-garbage-sorting-system-production.up.railway.app/** (no localhost). You typically have **two services**: the **frontend** (that URL) and the **backend** (Node, with its own Railway URL). Both need their own variables.

---

## Quick fix for “Server returned an error page instead of JSON”

1. **Find your backend URL**  
   In Railway → open the **backend** service (the one whose deploy logs say “Backend server running on port 8080”) → **Settings** → **Networking** (or **Generate domain**). Copy the full URL (e.g. `https://automatic-garbage-sorting-system-production-backend.up.railway.app`).

2. **Set BACKEND_URL on the frontend**  
   Open the **frontend** service (the one that serves the login page at the app URL above) → **Variables** → add **`BACKEND_URL`** = that backend URL (no trailing slash). Save.

3. **Redeploy the frontend**  
   Use **Redeploy** (or push a new commit) so the frontend container restarts with the new variable. Then try logging in again.

4. **Check the backend**  
   In the browser, open: `https://<your-backend-url>/api/health`  
   You should see JSON like `{"ok":true}`. If you see HTML or an error, the backend service needs `SUPABASE_SERVICE_KEY` and SMTP variables (see section 2 below), then redeploy the backend.

---

## 1. Frontend service (nginx) — the one at that URL

1. In Railway, open the service that serves **https://automatic-garbage-sorting-system-production.up.railway.app/** (your frontend).
2. Go to **Variables** and add:

| Variable | Value |
|----------|--------|
| `BACKEND_URL` | Your **backend** service's public URL from Railway (no trailing slash), e.g. `https://automatic-garbage-sorting-system-production-backend.up.railway.app` or whatever URL Railway shows for the backend service. |

Without this, nginx proxies `/api` to localhost and you get error pages (HTML) instead of JSON. Find the backend URL in Railway: open the backend service → **Settings** → **Networking** / **Generate domain**.

3. Redeploy the frontend after adding `BACKEND_URL`.

---

## 2. Backend service (Node)

1. Open your **backend** service in Railway (the one that runs the Node server, not the nginx one).
2. Go to **Variables** and add:

### Required for login and verification

| Variable | Where to get it |
|----------|------------------|
| `SUPABASE_SERVICE_KEY` | Supabase Dashboard → your project → **Settings → API** → copy the **service_role** key (secret). |

### Required for sending verification emails (Brevo)

| Variable | Example / notes |
|----------|------------------|
| `SMTP_HOST` | `smtp-relay.brevo.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | Your Brevo account email (e.g. `you@example.com`) |
| `SMTP_PASS` | Your Brevo API key (from Brevo: SMTP & API → API Keys; looks like `xkeysib-...`) |
| `SMTP_FROM` | A verified sender in Brevo, e.g. `"App Name <verified@yourdomain.com>"` |

### Optional (for CORS and links)

| Variable | Example |
|----------|---------|
| `FRONTEND_URL` | `https://automatic-garbage-sorting-system-production.up.railway.app` |
| `BACKEND_URL` | Your backend’s Railway URL (used in emails/links) |

3. **Redeploy** the backend after adding or changing variables.

**Do not set `ARDUINO_PORT`** on the backend service in Railway. Serial/Arduino is only used when running locally; in production the backend skips opening COM ports to avoid "No such file or directory" errors.

Until `SUPABASE_SERVICE_KEY` and (for email) the SMTP variables are set, the backend will log warnings and login/verification may fail or return errors.
