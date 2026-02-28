# Railway deployment – set these variables

Railway does **not** use your local `backend/.env` file. You must add every variable in the **Railway Dashboard** for the backend to work.

## Steps

1. Open [Railway Dashboard](https://railway.app/dashboard) and select your project.
2. Click your **backend** service (the one that runs the Node server).
3. Go to **Variables** (or **Environment**).
4. Add these variables (use **Add Variable** or **Raw Editor**):

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
| `FRONTEND_URL` | `https://your-frontend.up.railway.app` |
| `BACKEND_URL` | `https://your-backend.up.railway.app` |

5. **Redeploy** the backend after adding or changing variables (e.g. use **Redeploy** from the service menu).

Until `SUPABASE_SERVICE_KEY` and (for email) the SMTP variables are set in Railway, the backend will log warnings and login/verification may return errors or HTML instead of JSON.
