# Automatic Garbage Sorting System (AGSS) User Manual

This manual explains how to use the Automatic Garbage Sorting System, including the web system, machine learning detection, and hardware integration.

---

## 1) What This System Does

AGSS helps monitor and sort waste using:

- A web-based management system (frontend + backend)
- A machine learning (ML) detection flow (YOLO/Python scripts)
- Hardware devices (Arduino and Raspberry Pi)

Main outcome:

- Waste is classified into categories
- Bin levels update in real time
- Notifications are generated for bins that need attention

---

## 2) Core Waste Categories

The system uses these standard categories:

- `Biodegradable`
- `Non-Biodegradable`
- `Recyclable`
- `Unsorted`

For Arduino serial messages, equivalent labels may appear as:

- `BIO`
- `NON_BIO`
- `RECYCABLE`
- `UNSORTED`

---

## 3) User Roles and Typical Actions

### Super Admin

- Views system-wide analytics and accounts
- Manages high-level monitoring pages

### Admin

- Monitors bins and waste statistics
- Reviews category-level performance

### Employee / Collector

- Views bin status and fill levels
- Receives notifications
- Uses sorting actions (for connected hardware workflows)

---

## 4) System Architecture (Simple View)

The components are connected as follows:

1. **ML/Device Layer**
   - Raspberry Pi and/or YOLO scripts perform detection
2. **Backend Layer (Node/Express)**
   - Receives sensor/detection data
   - Updates database state and hardware status
3. **Database/Auth Layer (Supabase)**
   - Stores users, notifications, and operational data
4. **Frontend Layer (React/Vite)**
   - Displays dashboards, bins, and notifications to users
5. **Hardware Layer (Arduino + actuators)**
   - Receives sorting commands
   - Reports serial sensor lines

---

## 5) Before You Start (Checklist)

- Backend server is running
- Frontend is running
- Correct environment variables are configured
- Supabase service key is set on backend
- API URL is set on frontend (`VITE_API_URL`)
- Arduino is connected if using local serial mode
- If deployed (Railway), Arduino bridge is running on local PC

---

## 6) Running the System Locally

Open separate terminals:

### Terminal 1: Backend

```powershell
cd backend
npm install
npm start
```

Expected health check:

- Open `http://localhost:3001/api/health`
- Should return JSON like `{"ok": true}`

### Terminal 2: Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open the local frontend URL shown in terminal (commonly `http://localhost:5173`).

### Terminal 3 (Optional): WS server for ML stream

```powershell
cd ws-server
npm install
npm start
```

Default WebSocket port is `3001` unless `PORT` is set.

---

## 7) Login and Basic Navigation

1. Open the frontend URL.
2. Log in with your assigned account.
3. Navigate to:
   - Bin Monitoring
   - Notifications
   - Analytics dashboards (based on role)

What to expect:

- Live bin fill levels
- Category updates after detections
- Alerts around high fill thresholds (for example near 80% and 100%)

---

## 8) Notifications Usage

Notifications are sourced from backend + database records (including `notification_bin` data).

For users:

- Open **Notifications** from the left menu.
- Read new entries and operational alerts.
- Use them to prioritize collection/draining actions.

If notifications appear empty unexpectedly:

- Verify backend is reachable
- Verify frontend points to correct backend URL
- Verify backend has `SUPABASE_SERVICE_KEY`

---

## 9) Machine Learning Workflow (YOLO / Desktop / Pi)

The ML layer can classify waste and push updates into AGSS.

### Local ML mode

- YOLO/Python script sends detections to WS or backend endpoints
- System maps detected class to bin category
- Fill level increases and UI updates in real time

### Typical mapping behavior

- Incoming category/bin labels are normalized to AGSS bins:
  - bio -> biodegradable bin
  - non-bio -> non-biodegradable bin
  - recycle -> recyclable bin
  - unknown -> unsorted bin

### Desktop app note

The desktop script uses `.env` and `WS_URL` (defaults to `ws://localhost:3001` if unset).

---

## 10) Raspberry Pi Integration

Recommended API flow:

- Pi sends POST requests to backend endpoint:
  - `POST /api/device/sensor`

Minimum payload:

- `category` (required)

Optional payload:

- `processing_time`
- `device_id`
- `bin_id`

Connectivity test endpoint:

- `GET /api/device/health`

When Pi is connected correctly, new readings appear in backend logs and app monitoring views.

---

## 11) Arduino Hardware Integration

### Local backend mode (same PC with Arduino)

- Backend opens COM port directly
- Arduino serial lines are read into hardware state

### Deployed backend mode (Railway or cloud)

- Cloud backend cannot open COM ports
- Use local bridge script on PC with Arduino:
  - Reads Arduino serial
  - Sends updates to `POST /api/hardware/arduino`
  - Polls `GET /api/hardware/pending-sort` for commands

Sorting command behavior:

- App sends category to backend via `/api/hardware/sort`
- If serial is local, command is sent immediately to Arduino
- If deployed, command is queued for bridge pickup

---

## 12) Daily Operation Procedure

1. Start backend and verify `/api/health`.
2. Start frontend and login.
3. Confirm bin dashboard loads.
4. Start ML/WS and/or Pi detection process.
5. If using hardware:
   - Local mode: ensure Arduino COM port is free
   - Deployed mode: run Arduino bridge on local PC
6. Monitor bin levels and notifications.
7. Trigger collection/sorting actions when bins approach critical thresholds.

---

## 13) Troubleshooting Quick Guide

### A) Frontend works but no data

- Check `VITE_API_URL` points to backend
- Rebuild/redeploy frontend after changing env values
- Confirm backend health endpoint is reachable

### B) Notifications not appearing

- Confirm backend has `SUPABASE_SERVICE_KEY` (service_role key)
- Confirm app and backend use the same Supabase project
- Check backend deployment logs for DB access errors

### C) Arduino COM port error

- Close Serial Monitor or any app using the same COM port
- Ensure only one process opens the serial port
- Do not set Arduino serial env vars in cloud backend services

### D) Deployed mode sorting does not move hardware

- Ensure Arduino bridge is running on PC with USB-connected Arduino
- Confirm bridge uses correct backend URL and COM port
- Confirm `/api/hardware/pending-sort` is being polled

### E) ML detections do not update bins

- Verify WS URL/API URL in ML script environment
- Check ws-server/backend is running and reachable
- Confirm detection payload includes recognizable category/bin data

---

## 14) Security and Configuration Notes

- Keep `.env` secrets private (do not commit keys/passwords).
- Never expose Supabase `service_role` key in frontend code.
- Railway variables must be set per service (frontend vs backend).
- After changing frontend env values, redeploy/rebuild frontend.

---

## 15) Recommended Operator Checklist

Before each shift:

- Backend health endpoint checked
- Frontend accessible
- Notification page loading
- Hardware connection verified
- ML/Pi sender running (if enabled)

During shift:

- Watch fill level progression
- Respond to warning/critical notifications
- Validate sorting behavior after category commands

After shift:

- Confirm pending alerts are addressed
- Stop optional local scripts safely
- Record unusual failures for maintenance

---

## 16) Key Endpoints Reference

- `GET /api/health` -> backend health
- `GET /api/device/health` -> device API health
- `POST /api/device/sensor` -> receive Pi/ML reading
- `GET /api/hardware/status` -> current hardware state
- `POST /api/hardware/sort` -> request sort command
- `GET /api/hardware/pending-sort` -> bridge command pickup
- `POST /api/hardware/arduino` -> bridge sends Arduino reading

---

## 17) Support Notes for Maintainers

If users report issues, collect:

- Which environment (local or deployed)
- Current backend URL and frontend URL
- Whether Arduino is local serial or bridge mode
- Whether Pi/ML sender is active
- Last error message shown in UI or backend logs

This information is usually enough to isolate configuration vs runtime problems quickly.

