# How to Run Python on the Raspberry Pi (Pi not connected to your PC)

Use this guide when **Python is already installed** on the Pi and you (or someone else) are using the Pi directly—no cable or SSH from your laptop needed.

**CPU compatibility:** This program is compatible with the **Raspberry Pi 4B** CPU (ARM). All ML inference and training run on the Pi’s CPU; no GPU is required. The scripts automatically use CPU when they detect they are running on a Raspberry Pi.

---

## 1. Open a terminal on the Raspberry Pi

- **With monitor + keyboard:** Open **Terminal** from the menu (or press `Ctrl+Alt+T`).
- **Over the network (SSH):** From your laptop: `ssh pi@PI_IP` (replace `PI_IP` with the Pi’s IP, e.g. `192.168.1.50`). User might be `pi`, `admin`, or the one you created.

---

## 2. Check Python is installed

In the terminal on the Pi, run:

```bash
python3 --version
```

You should see something like `Python 3.9.2` or `Python 3.11.x`. If not, install with: `sudo apt update && sudo apt install -y python3 python3-pip`.

---

## 3. Go to the project folder on the Pi

The project (or at least the `raspberry` folder) must be on the Pi. For example:

```bash
cd ~/Automatic-Garbage-Sorting-System/raspberry
```

If the project is somewhere else, use that path instead (e.g. `cd /home/pi/AGSS/raspberry`).

---

## 4. Install Python dependencies (one time)

From the `raspberry` folder:

```bash
pip3 install requests
```

Optional (for loading `.env` in `agss_connect.py`):

```bash
pip3 install python-dotenv
```

---

## 5. Set the backend URL (so the Pi can talk to your app)

The Pi sends classification results to your **backend**. The backend can be:

- Your **laptop** (same Wi‑Fi): use your laptop’s IP, e.g. `http://192.168.1.100:3001`
- **Railway**: use your backend URL, e.g. `https://your-backend.up.railway.app`

**Option A – environment variable (recommended)**  
In the same terminal, before running Python:

```bash
export API_URL=http://YOUR_LAPTOP_IP:3001
```

Replace `YOUR_LAPTOP_IP` with the real IP (e.g. `192.168.1.100`). For Railway, use:  
`export API_URL=https://your-backend.up.railway.app`

**Option B – .env file in `raspberry`**  
Create a file named `.env` in the `raspberry` folder with:

```
API_URL=http://YOUR_LAPTOP_IP:3001
```

Again, replace with your laptop IP or Railway backend URL. No spaces around `=`.

---

## 6. Run the Python app

From the `raspberry` folder on the Pi:

**Send one test reading and exit:**
```bash
python3 run.py --once
```

**Run in a loop (sends a reading every 10 seconds; Ctrl+C to stop):**
```bash
python3 run.py
```

**Custom interval (e.g. every 30 seconds):**
```bash
python3 run.py --interval 30
```

- If the backend is running and reachable, you should see: `AGSS: sent to backend: Biodegradable`.
- If you see an error, check: backend is running, `API_URL` is set correctly, and the Pi and backend are on the same network (or use Railway URL).

**Quick one-liner test (without run.py):**
```bash
python3 -c "from agss_connect import send_to_backend; send_to_backend('Biodegradable', 0)"
```

---

## 7. Run your ML / inference script

If you have an inference script (e.g. in `LearningMachine/NutriBin-MachineLearning/`):

```bash
cd ~/Automatic-Garbage-Sorting-System/raspberry/LearningMachine/NutriBin-MachineLearning
python3 your_inference_script.py
```

To send results to the app from that script, either:

- **Use the connector:** In the script, add the `raspberry` folder to the path and import `send_to_backend` from `agss_connect` (see DOCS.md §18), then call `send_to_backend(category, processing_time)` after each prediction.
- **Or** paste the `send_to_backend` code from DOCS.md into the script and call it after each prediction.

Make sure `API_URL` is set (step 5) before running.

---

## 8. Run Python in interactive mode (optional)

To try commands line by line:

```bash
cd ~/Automatic-Garbage-Sorting-System/raspberry
python3
```

Then in the Python shell:

```python
>>> from agss_connect import send_to_backend
>>> send_to_backend("Recyclable", 1.5)
```

Type `exit()` to quit.

---

## Summary

| Step | What to do on the Pi |
|------|----------------------|
| 1 | Open Terminal (or SSH in). |
| 2 | Check: `python3 --version` |
| 3 | `cd` to the project’s `raspberry` folder. |
| 4 | `pip3 install requests` (and optionally `python-dotenv`). |
| 5 | Set `API_URL` (export or `.env`) to your backend (laptop IP:3001 or Railway URL). |
| 6 | Run the app: `python3 run.py --once` (or `python3 run.py` for a loop). |
| 7 | For your own ML script: `python3 your_script.py` from the NutriBin-MachineLearning folder. |

The Pi does **not** need to be connected to your PC by cable; it only needs the same Wi‑Fi (or internet for Railway) and the correct `API_URL` so Python can send data to your backend.
