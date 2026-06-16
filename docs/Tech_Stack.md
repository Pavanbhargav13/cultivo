# Automated Greenhouse Controller - Technology Stack

## 1. Stack Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend Layer                              │
│  React 18 + Vite | TypeScript | Tailwind CSS | Recharts        │
│  Grafana | WebSocket (Real-time updates)                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     API & Business Logic                        │
│  FastAPI (Python 3.11) | Starlette | JWT Authentication        │
│  WebSocket Support | CORS middleware                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                 IoT Integration & Automation                    │
│  MQTT Broker (Mosquitto) | Node-RED | TensorFlow Lite (LSTM)   │
│  Stable-Baselines3 (PPO) | scikit-learn (Isolation Forest)      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Data Layer                                 │
│  PostgreSQL 16 | InfluxDB 2.x | Redis (caching)                │
│  TimescaleDB Extensions                                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Infrastructure                               │
│  Docker | Railway (Backend) | Vercel (Frontend)                 │
│  GitHub CI/CD | Terraform (IaC)                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Frontend Stack

### 2.1 Core Framework
**React 18 + Vite**
- **Why:** Fast HMR, minimal bundle size, modern tooling
- **Version:** 18.2+
- **Key Features Used:**
  - Functional components + Hooks
  - Context API for state management
  - Suspense for code splitting
  - Concurrent rendering for responsive UI

**TypeScript**
- **Version:** 5.0+
- **Coverage:** 90%+ type coverage
- **Benefits:** Type safety, IDE autocomplete, refactoring confidence

### 2.2 State Management
**Zustand** (lightweight alternative to Redux)
- **Store Modules:**
  ```
  sensorStore.ts       → sensor readings, update frequency
  alertStore.ts        → active alerts, alert history
  userStore.ts         → auth state, preferences
  dashboardStore.ts    → layout, selected site, time range
  ```
- **Why:** Minimal boilerplate, easy testing, good DevX

**React Query** (Data synchronization)
- **Purpose:** Cache API responses, automatic refetch, background sync
- **Queries:**
  - `useSensors()` - polls every 5s
  - `useAlerts()` - realtime WebSocket
  - `usePredictions()` - polls every 10m
  - `useReports()` - fetch on demand

### 2.3 Styling
**Tailwind CSS + PostCSS**
- **Features:**
  - Utility-first approach
  - Dark mode support (for night operations)
  - Custom color palette (greenhouse theme: greens, earth tones)
  - Responsive grid (mobile-first)

**CSS Modules** (for component-specific styles)
- Used for complex layouts (dashboard grid, modal overlays)

### 2.4 UI Component Libraries
**Headless UI + Radix UI**
- Modal, Dropdown, Tooltip, Dialog components
- Why: Accessible, unstyled (full Tailwind control)

**Recharts** (Data visualization)
- **Charts Used:**
  - LineChart (temperature, humidity trends)
  - AreaChart (stacked metrics)
  - BarChart (energy consumption by hour)
  - Heatmap (daily patterns)
  - Gauge (live KPIs)

**Custom Gauge Widgets** (SVG-based)
- Real-time temperature/humidity gauges
- Smooth animations with Framer Motion

### 2.5 Real-Time Communication
**WebSocket** (via Starlette)
- **Endpoint:** `ws://api.greenhouse.io/ws/dashboard`
- **Message Frequency:** 5-10 seconds for sensor updates
- **Payload:** `{ sensor_id, value, timestamp, unit }`
- **Reconnection:** Exponential backoff + localStorage caching

**Polling Fallback** (if WebSocket unavailable)
- MQTT-over-HTTP for mobile browsers
- REST API polling (30s intervals)

### 2.6 Forms & Validation
**React Hook Form + Zod**
- **Forms:**
  - Setpoint adjustment (temperature, humidity)
  - Manual actuator control
  - Alert rule creation
  - Report generation
- **Validation:** Client-side (instant feedback) + server-side (security)

### 2.7 Icons & Assets
**Heroicons** (icon library)
- SVG icons (alert, thermometer, water droplet, etc.)
- Responsive sizing

**SVG Sprite Sheet** (custom greenhouse icons)
- Sensor icons, actuator status icons, plant health indicators

---

## 3. Backend Stack

### 3.1 API Framework
**FastAPI (Python 3.11)**
- **Why:**
  - Async by default (handles 1000s of concurrent connections)
  - Auto-generated API docs (Swagger UI)
  - Built-in validation (Pydantic)
  - Easy to scale
  
- **Version:** 0.104+
- **Key Libraries:**
  - `starlette` (underlying ASGI server)
  - `pydantic` (data validation)
  - `python-jose` (JWT tokens)
  - `passlib` (password hashing)

### 3.2 Application Structure
```
greenhouse-api/
├── main.py                    # FastAPI app initialization
├── config.py                  # Environment variables, DB config
├── models/
│   ├── sensor.py             # Pydantic models for sensors
│   ├── alert.py              # Alert data models
│   ├── user.py               # User, auth models
│   └── prediction.py         # LSTM output models
├── routes/
│   ├── sensors.py            # GET /sensors
│   ├── actuators.py          # POST /control/actuator
│   ├── predictions.py        # GET /predictions
│   ├── anomalies.py          # GET /anomalies
│   ├── alerts.py             # Alert rules CRUD
│   ├── reports.py            # Report generation
│   └── auth.py               # User login, token refresh
├── services/
│   ├── sensor_service.py     # Query InfluxDB
│   ├── ml_service.py         # LSTM, PPO, Isolation Forest
│   ├── alert_service.py      # Check rules, trigger notifications
│   ├── mqtt_service.py       # Publish commands to MQTT
│   └── notification_service.py  # SMS, Email, Push
├── middleware/
│   ├── auth.py               # JWT verification
│   ├── logging.py            # Request/response logging
│   └── error_handling.py     # Global exception handler
└── tests/
    ├── unit/
    └── integration/
```

### 3.3 Authentication & Authorization
**JWT (JSON Web Tokens)**
- **Token Payload:**
  ```json
  {
    "sub": "user_id_123",
    "email": "raj@farm.com",
    "role": "operator",
    "site_ids": ["site_1", "site_2"],
    "exp": 1718520000
  }
  ```
- **Refresh Token Strategy:** 15-min access tokens, 7-day refresh tokens

**Role-Based Access Control (RBAC)**
- **Roles:**
  - `admin` → full access
  - `operator` → view + manual control
  - `viewer` → read-only
  - `researcher` → analytics + export

**Endpoint Protection:**
```python
@router.get("/sensors/current")
async def get_sensors(current_user: User = Depends(get_current_user)):
    # User must have valid JWT
    if current_user.role not in ["operator", "admin", "researcher"]:
        raise HTTPException(status_code=403)
```

### 3.4 Database - PostgreSQL
**Primary Relational Database**

**Schemas:**
```sql
-- Users & Auth
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  role VARCHAR(50),        -- admin, operator, viewer, researcher
  created_at TIMESTAMP,
  last_login TIMESTAMP
);

-- Sensor Configuration
CREATE TABLE sensors (
  id UUID PRIMARY KEY,
  site_id UUID REFERENCES sites(id),
  sensor_type VARCHAR(50),  -- temperature, humidity, soil_moisture, etc.
  mqtt_topic VARCHAR(255),
  unit VARCHAR(20),         -- °C, %, ppm
  min_value FLOAT,
  max_value FLOAT,
  calibration_date TIMESTAMP,
  is_active BOOLEAN
);

-- Alert Rules
CREATE TABLE alert_rules (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  site_id UUID REFERENCES sites(id),
  condition VARCHAR(255),   -- e.g., "temperature > 30 for 5 min"
  severity VARCHAR(20),     -- critical, warning, info
  notification_channels TEXT[],  -- email, sms, push
  is_active BOOLEAN,
  created_at TIMESTAMP
);

-- Control Commands (Audit Trail)
CREATE TABLE actuator_commands (
  id UUID PRIMARY KEY,
  site_id UUID,
  actuator_id VARCHAR(100), -- heating, ventilation, misting
  command VARCHAR(100),     -- turn_on, set_duty_cycle_75, etc.
  triggered_by VARCHAR(50), -- user_manual, rule_engine, rl_policy
  issued_by UUID REFERENCES users(id),
  timestamp TIMESTAMP,
  status VARCHAR(20)        -- pending, executed, failed
);

-- Sites & Metadata
CREATE TABLE sites (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  location VARCHAR(255),
  area_sqm FLOAT,
  created_at TIMESTAMP
);

-- ML Model Metadata
CREATE TABLE ml_models (
  id UUID PRIMARY KEY,
  model_type VARCHAR(50),   -- lstm, ppo, isolation_forest
  version INT,
  training_date TIMESTAMP,
  performance_metrics JSONB,
  is_active BOOLEAN
);
```

**Indexes:**
```sql
CREATE INDEX idx_sensors_site ON sensors(site_id);
CREATE INDEX idx_alert_rules_user ON alert_rules(user_id);
CREATE INDEX idx_commands_timestamp ON actuator_commands(timestamp);
```

### 3.5 Database - InfluxDB
**Time-Series Database**

**Why:** Optimized for millions of high-frequency data points

**Buckets:**
```
greenhouse/
├── sensors/        → temperature, humidity, CO₂, soil_moisture, light
├── actuators/      → heating_duty, ventilation_speed, misting_duration
└── system/         → uptime, latency, connection_status
```

**Data Format:**
```
Measurement: sensor_reading
Tags: site_id, sensor_type, location
Fields: value (float), unit (string)
Timestamp: nanosecond precision

Example:
site_id=greenhouse_01,sensor_type=temperature,location=zone_a value=25.3 1718520000000000000
```

**Retention Policies:**
- Hot storage: 90 days (fast queries)
- Cold storage: 2 years (archive, slower access)
- Downsampling: Aggregate 1-minute data → 1-hour buckets after 30 days

**Queries (InfluxQL):**
```
-- Average temperature last 24 hours
SELECT MEAN(value) FROM sensor_reading 
WHERE sensor_type='temperature' 
  AND time > now() - 24h 
GROUP BY time(1h)

-- Latest sensor reading
SELECT LAST(value) FROM sensor_reading 
WHERE sensor_type='humidity' 
GROUP BY sensor_id
```

### 3.6 Cache Layer - Redis
**Use Cases:**
1. **Session Store:** JWT token blacklist (revocation)
2. **Rate Limiting:** API rate limits per user
3. **Aggregation Cache:** Pre-computed hourly averages
4. **Pub/Sub:** Alert notifications

**Keys Structure:**
```
sensor:{site_id}:{sensor_id}:latest  → { value, timestamp }  [TTL: 5min]
alert:{user_id}:queue                → [alert objects]       [TTL: 24h]
rate_limit:{user_id}                 → request count        [TTL: 1h]
```

---

## 4. IoT & Automation Stack

### 4.1 MQTT Broker - Mosquitto
**Lightweight pub/sub messaging**

**Configuration:**
```
mosquitto.conf:
listener 1883                    # Standard MQTT port
listener 8883                    # TLS secure port
protocol mqtt
max_connections -1               # Unlimited
persistence true
persistence_location /data
log_dest file /var/log/mosquitto/mosquitto.log
```

**Client Libraries:**
- **Python:** `paho-mqtt` (for FastAPI backend)
- **Node-RED:** Built-in MQTT node
- **ESP32 Sensors:** Arduino `PubSubClient`

**Topic Hierarchy:**
```
greenhouse/
├── sensors/
│   ├── temperature       → JSON { value: 24.5, unit: °C, ts: ... }
│   ├── humidity          → JSON { value: 65, unit: %, ts: ... }
│   ├── co2               → JSON { value: 550, unit: ppm, ts: ... }
│   ├── soil_moisture     → JSON { value: 45, unit: %, ts: ... }
│   └── light             → JSON { value: 850, unit: lux, ts: ... }
├── actuators/
│   ├── heating/status    ← JSON { duty_cycle: 75, power: 4.2kW }
│   ├── ventilation/cmd   ← JSON { fan_speed: 80 }
│   └── misting/cmd       ← JSON { duration_sec: 30, interval_min: 15 }
└── system/
    ├── health           → JSON { uptime_hrs: 48, cpu: 45%, mem: 62% }
    └── alerts           → JSON { event: "sensor_failure", severity: "critical" }
```

### 4.2 IoT Automation - Node-RED
**Visual automation workflows**

**Workflows:**

**Workflow 1: Temperature Control Loop**
```
MQTT Input (temperature)
  ↓
Function: Compare with setpoint
  ↓
Decision: if T < setpoint - 1°C
  ├→ MQTT Output: Increase heating
  └→ MQTT Output: Reduce ventilation
```

**Workflow 2: Alert Dispatch**
```
MQTT Alert Topic Input
  ↓
Function: Parse severity, filter by user preferences
  ↓
Switch: severity level
  ├→ CRITICAL: Send SMS (Twilio) + Email
  ├→ WARNING: Send Email only
  └→ INFO: Dashboard notification only
```

**Workflow 3: ML Inference Trigger**
```
MQTT Sensors (every 5s)
  ↓
Function: Buffer 60 readings (5-min window)
  ↓
HTTP Call: POST /predict → FastAPI
  ↓
MQTT Output: Publish predictions to dashboard
```

**Workflow 4: Anomaly Response**
```
MQTT Anomaly Detected
  ↓
Function: Lookup rule for this anomaly type
  ↓
Auto-Mitigation Actions:
  ├→ High temperature → Increase ventilation
  ├→ Sensor failure → Switch to backup sensor
  └→ Fungal risk → Reduce humidity setpoint
```

---

## 5. Machine Learning Stack

### 5.1 LSTM (Long Short-Term Memory) - Predictive Control

**Framework:** TensorFlow / Keras

**Model Architecture:**
```
Input Layer: (batch_size, sequence_length=48, features=12)
  ↓
LSTM Layer 1: 128 units, return_sequences=True
  ↓
Dropout: 0.2
  ↓
LSTM Layer 2: 64 units
  ↓
Dropout: 0.2
  ↓
Dense Layer: 32 units, ReLU
  ↓
Output Layer: 3 units (temp_2h, humidity_2h, soil_moisture_6h)
```

**Input Features (12):**
- temperature (current)
- humidity (current)
- CO₂ (current)
- soil_moisture (current)
- light_intensity
- time_of_day_sin, time_of_day_cos (cyclical encoding)
- day_of_year_sin, day_of_year_cos
- heating_duty_cycle
- ventilation_speed
- misting_duration

**Training:**
- **Data:** 1 year of historical greenhouse logs
- **Train/Val/Test:** 70%/15%/15%
- **Epochs:** 50 (early stopping on validation loss)
- **Optimizer:** Adam (lr=0.001)
- **Loss:** MSE for continuous variables
- **Batch Size:** 32

**Retraining Schedule:**
```python
# Daily retraining job
@scheduler.scheduled_job('cron', hour=2, minute=0)
async def retrain_lstm():
    recent_data = influxdb.query(last_30_days)
    model = train_lstm(recent_data)
    if evaluate(model) > old_model_score:
        deploy_model(model)
    else:
        alert_admin("LSTM performance degraded")
```

**Inference:**
```python
@router.get("/predictions/next-24h")
async def get_predictions():
    latest_sequence = influxdb.get_last_48_readings()
    predictions = lstm_model.predict(latest_sequence)
    return {
        "temperature_2h": predictions[0],
        "humidity_2h": predictions[1],
        "soil_moisture_6h": predictions[2],
        "confidence": 0.87
    }
```

### 5.2 PPO (Proximal Policy Optimization) - RL Agent

**Framework:** Stable-Baselines3

**Environment:**
```python
class GreenhouseEnv(gym.Env):
    observation_space = Box(low=0, high=100, shape=(12,))  # current sensors
    action_space = Box(
        low=0, 
        high=1, 
        shape=(4,)  # heating, ventilation, misting, shade
    )
    
    def step(self, action):
        # Execute action → simulate next state
        # Calculate reward based on control objectives
        return observation, reward, done, info
```

**Reward Function:**
```python
def calculate_reward(state, action):
    temp_error = abs(state['temp'] - setpoint['temp']) / 10
    humidity_error = abs(state['humidity'] - setpoint['humidity']) / 20
    energy_cost = sum(action) * 0.01  # Normalize action values
    
    reward = (
        10 * (1 - temp_error)      # Prefer controlled temperature
        + 5 * (1 - humidity_error)  # Prefer controlled humidity
        - energy_cost               # Penalize energy use
        - 20 * (1 if anomaly else 0)
    )
    return reward
```

**Training:**
- **Algorithm:** PPO (3 steps per training batch)
- **Total Timesteps:** 100k (simulated days)
- **Learning Rate:** 3e-4
- **Training Frequency:** Daily (on latest 24h data)
- **Rollout Buffer:** 2048 steps

**Policy Deployment:**
```python
# Compare with baseline (rule-based) policy
if evaluate_policy(new_policy, episodes=10) > baseline_score:
    backup_policy()  # Save current policy
    deploy_policy(new_policy)
else:
    rollback_to_policy(backup)
```

### 5.3 Isolation Forest - Anomaly Detection

**Framework:** scikit-learn

**Model:**
```python
from sklearn.ensemble import IsolationForest

model = IsolationForest(
    contamination=0.05,  # Expect 5% anomalies
    n_estimators=100,
    random_state=42
)

# Train on historical sensor data
X_train = load_historical_data(days=30)
model.fit(X_train)

# Predict: -1 = anomaly, 1 = normal
anomaly_scores = model.decision_function(X_test)
predictions = model.predict(X_test)
```

**Features:**
- Last 10 readings (each sensor, calculated: value, rate_of_change, std_dev)
- Multivariate relationships (e.g., temp-humidity correlation)
- Historical comparison (vs. same hour last week)

**Anomaly Types Detected:**
1. **Sensor Drift:** Gradual offset from expected range
2. **Abrupt Failure:** Sudden value jumps or stuck readings
3. **Environmental Spikes:** Unexpected temperature/humidity changes
4. **Biotic Risk:** Fungal/pest conditions (high temp + humidity)

**Real-Time Detection:**
```python
@task
async def detect_anomalies():
    while True:
        latest_readings = influxdb.get_last_reading()
        anomaly_score = model.decision_function([latest_readings])
        
        if anomaly_score < -0.5:  # Threshold
            alert = create_alert(latest_readings, anomaly_score)
            await alert_service.dispatch(alert)
        
        await asyncio.sleep(60)  # Check every 60 seconds
```

---

## 6. Notification Stack

### 6.1 Email
**Service:** SendGrid
- **Use:** Daily reports, weekly summaries, critical alerts
- **Templates:** Jinja2 (HTML + plain text)
- **Rate:** Up to 100 emails/day free tier

### 6.2 SMS
**Service:** Twilio
- **Use:** Critical alerts (temperature, sensor failure)
- **Template:** Pre-defined messages (e.g., "ALERT: Greenhouse temp 32°C")
- **Recipients:** Admin phone numbers configured per site

### 6.3 Push Notifications
**Service:** Firebase Cloud Messaging (FCM)
- **Use:** In-app alerts for mobile app
- **Payload:** Alert ID, type, severity, site name

### 6.4 In-App Notifications
**Method:** WebSocket broadcast
- Real-time dashboard notifications (no page refresh needed)
- Auto-dismiss after 5 seconds or manual close

---

## 7. Infrastructure & DevOps

### 7.1 Containerization - Docker

**Services:**
```yaml
version: '3.9'
services:
  # Backend API
  api:
    build: ./backend
    environment:
      - DATABASE_URL=postgresql://...
      - INFLUXDB_URL=http://influxdb:8086
      - REDIS_URL=redis://redis:6379
      - MQTT_BROKER=mosquitto:1883
    ports:
      - "8000:8000"
    depends_on:
      - postgres
      - influxdb
      - redis
      - mosquitto
  
  # PostgreSQL
  postgres:
    image: postgres:16
    environment:
      - POSTGRES_DB=greenhouse
      - POSTGRES_PASSWORD=secure_pwd
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  # InfluxDB
  influxdb:
    image: influxdb:2.7
    environment:
      - INFLUXDB_DB=greenhouse
    volumes:
      - influxdb_data:/var/lib/influxdb2
  
  # Redis
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
  
  # MQTT Broker
  mosquitto:
    image: eclipse-mosquitto:latest
    ports:
      - "1883:1883"
      - "8883:8883"
    volumes:
      - ./mosquitto.conf:/mosquitto/config/mosquitto.conf
      - mosquitto_data:/mosquitto/data

  # Node-RED
  nodered:
    image: nodered/node-red:latest
    ports:
      - "1880:1880"
    volumes:
      - nodered_data:/data
    environment:
      - NODE_RED_ENABLE_PROJECTS=true

volumes:
  postgres_data:
  influxdb_data:
  redis_data:
  mosquitto_data:
  nodered_data:
```

### 7.2 Hosting Platforms

**Backend: Railway**
- FastAPI deployment
- PostgreSQL managed database
- Auto-scaling based on CPU/memory
- Monitoring & logs

**Frontend: Vercel**
- React/Vite deployment
- CDN (global caching)
- Preview deployments on PRs
- Serverless functions (optional)

### 7.3 CI/CD Pipeline - GitHub Actions

**Build & Test:**
```yaml
name: CI/CD Pipeline

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - run: pip install -r requirements.txt
      - run: pytest tests/
      - run: flake8 app/ --count --select=E9,F63,F7,F82 --show-source

  deploy-backend:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: railway up --service api
      - run: railway run alembic upgrade head  # DB migrations

  deploy-frontend:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install && npm run build
      - uses: vercel/action@v6
```

### 7.4 Infrastructure as Code - Terraform

```hcl
# Provider: Railway
resource "railway_service" "api" {
  name = "greenhouse-api"
  runtime = "python"
  build_command = "pip install -r requirements.txt"
  start_command = "uvicorn main:app --host 0.0.0.0"
  environment = {
    DATABASE_URL = railway_database.postgres.connection_string
    INFLUXDB_URL = railway_database.influxdb.url
  }
}

# Database: PostgreSQL
resource "railway_database" "postgres" {
  name = "greenhouse-db"
  engine = "postgresql"
  version = "16"
}

# Monitoring (LogRocket, Sentry)
resource "sentry_project" "api" {
  organization = "greenhouse-org"
  team = "devops"
  name = "greenhouse-api"
}
```

---

## 8. Development & Testing

### 8.1 Local Development Setup

**Requirements:**
- Python 3.11+ (Backend)
- Node.js 18+ (Frontend)
- Docker & Docker Compose
- PostgreSQL 16 (local or Docker)
- Redis (Docker)

**Setup Steps:**
```bash
# Clone repository
git clone https://github.com/greenhouse-controller/repo.git
cd repo

# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Update .env with local PostgreSQL/InfluxDB URLs
python -m pytest tests/
uvicorn main:app --reload

# Frontend
cd ../frontend
npm install
npm run dev  # Vite dev server on localhost:5173

# Docker services
docker-compose up -d  # Starts PostgreSQL, InfluxDB, Redis, MQTT
```

### 8.2 Testing Strategy

**Unit Tests:**
- FastAPI endpoints (mocked DB, MQTT)
- Pydantic models
- Utility functions

**Integration Tests:**
- Database queries
- MQTT publish/subscribe
- API auth flow

**E2E Tests (Cypress):**
- Login flow
- Dashboard sensor updates
- Alert creation & delivery
- Report export

**Load Testing (Locust):**
- 100 concurrent users
- Sensor polling (5s intervals)
- WebSocket connections
- Dashboard updates

---

## 9. Security & Compliance

### 9.1 Data Security
- **Encryption in Transit:** TLS 1.3 (HTTPS, secure MQTT)
- **Encryption at Rest:** Database encryption (PostgreSQL pgcrypto)
- **API Keys:** Rotated monthly, stored in Railway secrets

### 9.2 Authentication
- **OAuth 2.0** (future: Google/GitHub login)
- **JWT Tokens** (15 min expiry, refresh token strategy)
- **Password:** bcrypt hashing, min 12 characters

### 9.3 Monitoring & Logging
- **Application Logs:** Sentry (error tracking)
- **Infrastructure Logs:** Railway dashboard, Vercel analytics
- **Audit Trail:** PostgreSQL logs (user actions, config changes)

---

## 10. Performance Specifications

| Metric | Target | Justification |
|--------|--------|---------------|
| API Response Time | <500ms | User-facing operations |
| MQTT Latency | <100ms | Real-time control |
| Dashboard Update | <10s | Observable for operators |
| Alert Latency | <2min | Time to react to anomalies |
| Query (30-day data) | <2s | Historical analysis |
| Concurrent Users | 20 per site | Typical team size |

---

## 11. Future Enhancements

- **Mobile App:** React Native (iOS/Android)
- **Edge ML:** Deploy LSTM to ESP32 (TensorFlow Lite)
- **Computer Vision:** Plant health scoring via drone images
- **Weather Integration:** API integration for external weather data
- **Predictive Maintenance:** Sensor lifespan prediction

---

**Document Version:** 1.0  
**Last Updated:** June 2026  
**Owner:** Lazy (B.E. CSE AI&ML, PES Mandya)
