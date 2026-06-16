# Cultivo - Smart Greenhouse Automation System

Cultivo is a high-fidelity, production-grade greenhouse automated monitoring and alerting system. Designed with a premium light editorial landing page and a hybrid AeuxGlobal-style dashboard (dark-green sidebar with soft-white card workspace), Cultivo integrates real-time telemetry, machine learning forecasting, and automated environmental loop controls with cloud alerts.

---

## 🌟 Key Features

*   **Premium Landing Page (Cultivo style)**: A clean, modern, light editorial layout with stats counters, collaborative badges, and a scrollable features showcase.
*   **Dual-View Interactive Dashboard (AeuxGlobal style)**:
    *   **Telemetry Dashboard**: Sparkline charts, historical Recharts trend graphs, carbon offsets analytics, active zone heatmaps, and live actuator override logs.
    *   **Analytics Panel**: Radial gauge representing the Automation Deviation Index, water reservoir levels, air flow, and grid power consumption breakdown.
*   **Automated Actuator Loop**: Backend automatically triggers actuators (Grow Lights, Fans, Vents, Irrigation) depending on the active crop's thresholds.
*   **Machine Learning Forecasts**: Embedded predictor model forecasts sensor values in the next cycle to preemptively mitigate environmental stresses.
*   **Intelligent Cloud Webhooks (n8n Integration)**:
    *   Direct webhook dispatches for emergency stops and critical sensor anomalies.
    *   **Dynamic 5-Minute Rate-Limiting**: Smart alerts throttle background simulator noise while keeping manual overrides instant for presentations.
    *   **Flattened Payload Matching**: Webhook payloads are spread to the top-level of the JSON payload for seamless n8n Switch/Trigger node routing.

---

## 📂 Project Structure

```text
c:\GreenHouse-Auto
├── backend/                  # FastAPI Backend API
│   ├── ml/                   # Machine Learning forecasting models
│   ├── routers/              # API Route Controllers (sensors, actuators, emergency, crops)
│   ├── seed/                 # Initial crop database seeds
│   ├── services/             # Anomaly detection, logging, and webhook dispatches
│   └── main.py               # Main entrypoint
├── frontend/                 # Vite + React Frontend
│   ├── src/
│   │   ├── assets/           # Custom generated illustration assets
│   │   ├── components/       # Layouts (LandingPage, Sidebar, TopMetrics, Views)
│   │   ├── context/          # CropContext (live sensor stream and backend state sync)
│   │   └── App.jsx           # App routing & View Controller
├── docs/                     # Architectural specs and system design phases
├── greenhouse.db             # Local SQLite database
└── requirements.txt          # Shared dependencies list
```

---

## 🚀 Quick Start Guide

### Step 1: Run the Backend API
Navigate to the root directory and start the FastAPI Uvicorn server:
```bash
python -m uvicorn backend.main:app --reload
```
*The database tables will be automatically created and seeded with crop profiles on startup.*

### Step 2: Run the Simulator
Launch the telemetry simulator to start posting live sensor data:
```bash
python backend/simulator/seed_data.py
```

### Step 3: Run the Frontend
Navigate to the frontend folder, install dependencies, and launch Vite:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173/` in your browser to explore the landing page and dashboard!

---

## ⚙️ Environment Configuration

To hook up your cloud n8n alerting system, specify the endpoint inside the backend configuration file:

**`backend/.env`**:
```env
N8N_WEBHOOK_URL=https://godszzzz.app.n8n.cloud/webhook/greenhouse-alert
```
*No server restarts are required. The webhook dispatcher reloads the environment properties dynamically.*
