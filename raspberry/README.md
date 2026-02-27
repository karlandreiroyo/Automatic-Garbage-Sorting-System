# Raspberry Pi – send sensor data to the backend (real time)

This small app runs **on the Raspberry Pi** and sends sensor/device data to your **Node.js backend**. The backend saves the data into **Supabase** (`waste_items`), so your dashboard and analytics stay real time.

## What it does

- Sends a **POST** request to `API_URL/api/device/sensor` with:
  - `category`: one of `Biodegradable`, `Non-Biodegradable`, `Recycle`, `Unsorted`
  - `processing_time`: number (seconds)
  - optional: `bin_id`, `device_id`
- The **backend** (this repo’s `backend`) receives it and inserts a row into Supabase `waste_items`.
- Your **frontend** (dashboard, waste categories, data analytics) already reads from `waste_items`, so new Pi data appears in real time (or after refresh / with Supabase Realtime).

## Setup on the Raspberry Pi

1. **Copy this folder to the Pi** (from your PC):
   ```bash
   scp -r "C:\Users\karla\Automatic-Garbage-Sorting-System\raspberry" admin@192.168.0.118:/home/admin/
   ```

2. **On the Pi**, install Node.js if needed:
   ```bash
   node -v   # should be 18+ (fetch is built-in)
   ```

3. **Install dependencies and create `.env`** (in the `raspberry` folder):
   ```bash
   cd /home/admin/raspberry
   npm install
   cp env.example .env
   nano .env
   ```
   Set `API_URL` to your **PC’s IP** (where the backend runs), e.g.:
   ```env
   API_URL=http://192.168.0.108:3001
   ```

4. **Run the app**:
   ```bash
   npm start
   ```
   - Sends one reading every 10 seconds (configurable via `INTERVAL_MS`).
   - Use `node raspberry.js --once` to send a single reading and exit.

## Using real sensors / hardware

Right now `raspberry.js` uses **simulated** data in `getSimulatedReading()`. To use real hardware:

- Replace the body of `getSimulatedReading()` with:
  - GPIO/sensor reads (e.g. with `onoff` or Python and a small HTTP call), or
  - Camera/ML result (e.g. “Biodegradable”), or
  - Any logic that returns `{ category, processing_time?, bin_id?, device_id? }`.
- Keep calling `sendReading(body)` with that object so the backend and Supabase stay the same.

## Updating the app on the Pi

After you change the code on your PC, copy the folder again and restart:

```powershell
# On your PC
scp -r "C:\Users\karla\Automatic-Garbage-Sorting-System\raspberry" admin@192.168.0.118:/home/admin/
```

Then on the Pi:

```bash
cd /home/admin/raspberry
# If you use npm start in the background, stop it (Ctrl+C or kill the process), then:
npm start
```

## Backend API (already in this repo)

- **POST** `/api/device/sensor`  
  Body: `{ category?, processing_time?, bin_id?, device_id? }`  
  Saves one row into Supabase `waste_items`.

- **GET** `/api/device/health`  
  Returns `{ status: 'ok' }` so the Pi can check that the backend is reachable.

Your backend (Node.js) and database (Supabase) are already set up; this small app is the only extra piece that runs on the Pi to send data in real time.
