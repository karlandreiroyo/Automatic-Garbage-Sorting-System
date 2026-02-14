# Hardware ↔ Database Connection

Bins in Bin Monitoring (Admin and Super Admin) are connected to hardware and the database so that when a user opens a bin (collector) or hardware detects waste, the data flows correctly.

## Architecture

```
Hardware (Arduino / Raspberry Pi)
    ↓ sends device_id, category
Backend (/api/device/sensor)
    ↓ resolves bin_id from device_id if needed
Database (waste_items, bins)
    ↓ fill levels, ownership
Bin Monitoring (Admin / Super Admin)
```

## Setup

### 1. Add `device_id` column to `bins` table

Run in **Supabase Dashboard → SQL Editor**:

```sql
ALTER TABLE public.bins
ADD COLUMN IF NOT EXISTS device_id TEXT DEFAULT NULL;
```

Or use the script: `backend/scripts/add-device-id-to-bins.sql`

### 2. Add `assigned_at` column to bins (for automatic 0 on new assignment)

Run in **Supabase Dashboard → SQL Editor**:

```sql
ALTER TABLE public.bins
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ DEFAULT NULL;
```

Or use: `backend/scripts/add-assigned-at-to-bins.sql`

When a bin is assigned to a collector, only `waste_items` created after `assigned_at` count toward fill level.

### 3. Add a bin and link it to hardware

**Admin** or **Super Admin** → Bin Monitoring → **Add Bin**:

- Fill in **Bin Location** and (Admin only) **Assigned Collector**
- **Device ID** (optional): Enter the ID your hardware uses (e.g. `raspberry-pi-1`, `arduino-com7`)

The same `device_id` must be configured on your hardware (Pi/Arduino) so detections are attributed to this bin.

### 4. Configure hardware to send `device_id`

**Raspberry Pi** – in `.env`:

```env
DEVICE_ID=raspberry-pi-1
```

The Pi sends `device_id` in each POST to `/api/device/sensor`. The backend looks up the bin with that `device_id` and sets `bin_id` on the `waste_items` row.

**Arduino** – Connects via serial (USB). Backend reads BIO/NON_BIO/RECYCABLE/UNSORTED and Weight. When Arduino detects waste, backend inserts into waste_items. When using the collector frontend (employee Bin Monitoring), the frontend polls `/api/hardware/status` and the logged-in collector’s assigned bins are used for `bin_id`. Set `ARDUINO_PORT=COM7` in backend/.env. **Close Arduino Serial Monitor** when running the backend – both use the same COM port. See `arduino/README.md`.

## Collector Bin Monitoring – Hardware Connection

| Source | Flow |
|--------|------|
| **Arduino** (serial) | Arduino → BIO/NON_BIO/etc. → backend `hardwareStore` → `hardwareToDb` → `waste_items` → `/levels` → Collector view |
| **Raspberry Pi** | Pi POST → `/api/device/sensor` → `waste_items` → `/levels` → Collector view |
| **Weight sensor** | Arduino → `Weight: X g` → backend → `/api/hardware/status` → Collector view |

## Flow: User + Hardware + Database

1. **Add Bin** (Admin/Super Admin): Create bin in database, optionally set `device_id`.
2. **Assign Collector** (Admin Accounts): Link bin to a collector.
3. **Collector logs in** (Employee): Loads assigned bins from the database.
4. **Hardware detects waste**:
   - Pi posts to `/api/device/sensor` with `device_id` (and optionally `bin_id`).
   - Backend finds the bin by `device_id`, inserts into `waste_items` with `bin_id`.
5. **Bin Monitoring** reads `waste_items` per bin and shows fill levels.

All bins shown in Admin/Super Admin Bin Monitoring come from the database. Fill levels come from `waste_items`. Hardware is connected via `device_id` on the bin and in the device payload.

## Per-Collector Data (each collector sees only their bins)

In the **Collector (Employee)** Bin Monitoring view:

- Fill levels come from `GET /api/collector-bins/levels`, which fetches `waste_items` for bins assigned to **that collector only**.
- Each collector sees data from their own assigned bins and hardware, not shared with other collectors.
- The view shows **individual bins** (Bin 1, Bin 2, ... Bin 11) with each bin’s own fill level and events.
- **Automatic 0** for new bins: when a bin is newly assigned to a collector (`assigned_at`), only `waste_items` created after that time count; new assignments start at 0%.
- Each bin has its own events/activities; data is not shared between bins.
- The view polls `/levels` every 2 seconds so it stays in sync with the database.

## Collection History → notification_bin (Real-time per collector)

Collection History for collectors is connected to the `notification_bin` table in Supabase.

### 1. Add columns to notification_bin

Run in **Supabase Dashboard → SQL Editor**:

```sql
-- backend/scripts/add-notification-bin-columns.sql
ALTER TABLE public.notification_bin
  ADD COLUMN IF NOT EXISTS collector_id int8 REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS bin_category text;
```

### 2. Enable Realtime on notification_bin

In **Supabase Dashboard → Table Editor → notification_bin** → click **Enable Realtime**.

### 3. Flow

- When a collector drains a bin, the drain API inserts into `notification_bin` (bin_id, status, first_name, last_name, middle_name).
- `GET /api/collector-bins/collection-history` reads from `notification_bin`.
- The frontend subscribes to Supabase Realtime on `notification_bin` so new drains appear instantly without refresh.

### 4. If notification_bin stays empty (not connected)

1. **Check backend/.env** – `SUPABASE_SERVICE_KEY` must be set to your **service_role** key (Supabase → Settings → API → service_role). The anon key may be blocked by RLS.

2. **Check RLS on notification_bin** – If Row Level Security is enabled:
   - Add policy: allow INSERT for service_role
   - Or in Supabase → Table Editor → notification_bin → "Add RLS policy" → allow INSERT for `service_role`

3. **Check backend console** – When you drain a bin, look for `[notification_bin] insert error:` in the terminal. It shows the exact Supabase error.
