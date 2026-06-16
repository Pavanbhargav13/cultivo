# Automated Greenhouse Controller - Architecture

## 1. High-Level System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
│  │  Web Browser │  │  Mobile App  │  │  Grafana Dashboard       │   │
│  │ (React+Vite)│  │ (React Native)  │ (Analytics & Trends)       │   │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘   │
└────────────────┬─────────────────────────────┬──────────────────────┘
                 │                             │
         HTTP/HTTPS                     WebSocket/MQTT
                 │                             │
┌────────────────▼─────────────────────────────▼──────────────────────┐
│                        API GATEWAY LAYER                             │
│                    FastAPI (Python 3.11)                            │
│  ┌──────────┐ ┌──────────┐ ┌────────────┐ ┌────────────────────┐  │
│  │   JWT    │ │  CORS    │ │  Request   │ │   WebSocket        │  │
│  │   Auth   │ │ Policy   │ │  Validation│ │   Connection Mgr   │  │
│  └──────────┘ └──────────┘ └────────────┘ └────────────────────┘  │
└────────────────┬────────────────────────────────────────────────────┘
                 │
    ┌────────────┼────────────┬──────────────┬──────────────┐
    │            │            │              │              │
    ▼            ▼            ▼              ▼              ▼
┌─────────┐  ┌─────────┐  ┌───────────┐  ┌──────────┐  ┌─────────┐
│Sensors  │  │Predictions  │Actuators  │  │Alerts    │  │Reports  │
│Route    │  │Route        │Route      │  │Route     │  │Route    │
└────┬────┘  └────┬────┘  └─────┬─────┘  └─────┬────┘  └────┬────┘
     │            │             │              │            │
     └────────────┼─────────────┼──────────────┼────────────┘
                  │
         ┌────────▼────────┐
         │  SERVICE LAYER  │
         │  (Business      │
         │   Logic)        │
         └────────┬────────┘
                  │
     ┌────────────┼────────────┬──────────────┐
     │            │            │              │
     ▼            ▼            ▼              ▼
┌──────────┐ ┌──────────┐ ┌───────────┐ ┌────────────┐
│Sensor    │ │ML Service│ │Alert      │ │Notification
│Service   │ │(LSTM/PPO)│ │Service    │ │Service
└────┬─────┘ └────┬─────┘ └─────┬─────┘ └─────┬──────┘
     │            │             │             │
     └────────────┼─────────────┼─────────────┘
                  │
         ┌────────▼────────┐
         │   DATA LAYER    │
         └────────┬────────┘
                  │
     ┌────────────┼────────────┬──────────────┐
     │            │            │              │
     ▼            ▼            ▼              ▼
┌──────────┐ ┌──────────┐ ┌────────────┐ ┌────────────┐
│PostgreSQL│ │InfluxDB  │ │Redis Cache │ │MQTT Broker │
│(Metadata)│ │(Timeseries) (Sessions)  │ (IoT Events)│
└──────────┘ └──────────┘ └────────────┘ └────────────┘
                  │
         ┌────────▼────────┐
         │  IOT LAYER      │
         └────────┬────────┘
                  │
     ┌────────────┼────────────┬──────────────┐
     │            │            │              │
     ▼            ▼            ▼              ▼
┌──────────┐ ┌──────────┐ ┌───────────┐ ┌────────────┐
│Sensors   │ │Node-RED  │ │Actuators  │ │Smart Relay │
│(ESP32)   │ │(Workflow)│ │Controllers│ │Controllers │
└──────────┘ └──────────┘ └───────────┘ └────────────┘
```

---

## 2. Component Architecture

### 2.1 Client Tier

**Web Application (React + Vite)**
```
src/
├── pages/
│   ├── Dashboard.jsx       # Main monitoring view
│   ├── Analytics.jsx       # Trends, comparisons
│   ├── Control.jsx         # Manual control panel
│   └── Reports.jsx         # Generate & download reports
├── components/
│   ├── SensorGauges.jsx    # Real-time gauges
│   ├── AlertPanel.jsx      # Alert notifications
│   ├── LineChart.jsx       # Historical trends
│   └── SetpointControl.jsx # Temperature/humidity adjustment
├── hooks/
│   ├── useSensorData.js    # Fetch & subscribe to sensors
│   ├── useWebSocket.js     # Manage WS connections
│   └── useAuth.js          # Authentication context
├── services/
│   ├── api.js              # HTTP client (Axios)
│   ├── mqtt.js             # MQTT client (for browser)
│   └── auth.js             # JWT token management
└── store/
    ├── sensorStore.js      # Zustand store
    ├── alertStore.js       # Alert state
    └── userStore.js        # User auth state
```

**Data Flow (Sensor Updates):**
```
Physical Sensor (temperature probe)
  ↓ (MQTT message every 5s)
MQTT Broker (Mosquitto)
  ↓ (WebSocket subscription from React)
React Component
  ↓ (setState/Zustand dispatch)
Dashboard (gauge, chart re-render)
```

---

### 2.2 API Gateway & Routing

**FastAPI Application Structure:**

```python
# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.authentication import AuthenticationMiddleware

app = FastAPI(title="Greenhouse Controller API")

# Middleware stack
app.add_middleware(CORSMiddleware, allow_origins=["*"])
app.add_middleware(AuthenticationMiddleware, backend=JWTBackend())

# Route mounting
app.include_router(sensors_router, prefix="/api/sensors")
app.include_router(actuators_router, prefix="/api/control/actuators")
app.include_router(predictions_router, prefix="/api/predictions")
app.include_router(anomalies_router, prefix="/api/anomalies")
app.include_router(alerts_router, prefix="/api/alerts")
app.include_router(reports_router, prefix="/api/reports")
app.include_router(auth_router, prefix="/api/auth")

# WebSocket endpoint
@app.websocket("/ws/dashboard")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    # Broadcast sensor updates in real-time
```

**Endpoint Structure:**

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/api/sensors/current` | Latest sensor readings | JWT |
| GET | `/api/sensors/{id}/history` | Historical data (1h, 1d, 7d) | JWT |
| POST | `/api/control/actuators` | Manual actuator control | JWT + operator role |
| GET | `/api/predictions/next-24h` | LSTM predictions | JWT |
| GET | `/api/anomalies?days=7` | Detected anomalies | JWT |
| POST | `/api/alerts/rules` | Create alert rule | JWT + admin |
| GET | `/api/reports/energy-usage` | Generate report | JWT |
| POST | `/api/auth/login` | User authentication | None |
| WS | `/ws/dashboard` | Real-time updates | JWT (via query param) |

---

### 2.3 Business Logic Layer (Services)

**Service Architecture:**

```python
# services/sensor_service.py
class SensorService:
    def __init__(self, influxdb_client, postgres_client):
        self.influx = influxdb_client
        self.postgres = postgres_client
    
    async def get_latest_readings(self, site_id: str):
        # Query InfluxDB for last reading per sensor
        readings = self.influx.query(
            f'SELECT LAST(value) FROM sensor_reading WHERE site_id={site_id}'
        )
        return format_readings(readings)
    
    async def get_historical_data(self, sensor_id: str, start: datetime, end: datetime):
        # Query InfluxDB with aggregation
        query = f'''
            SELECT MEAN(value) as avg, MIN(value) as min, MAX(value) as max
            FROM sensor_reading
            WHERE sensor_id={sensor_id} AND time >= {start} AND time <= {end}
            GROUP BY time(1h)
        '''
        return self.influx.query(query)

# services/ml_service.py
class MLService:
    def __init__(self, lstm_model, ppo_agent, isolation_forest):
        self.lstm = lstm_model
        self.ppo = ppo_agent
        self.iso_forest = isolation_forest
    
    async def predict_next_24h(self, site_id: str):
        # Fetch last 48 readings (sequence for LSTM)
        sequence = await self.sensor_service.get_last_n_readings(site_id, 48)
        
        # Preprocess (normalize, encode)
        X = preprocess(sequence)
        
        # Predict
        predictions = self.lstm.predict(X)
        
        return {
            "temperature_2h": predictions[0],
            "humidity_2h": predictions[1],
            "soil_moisture_6h": predictions[2],
            "confidence": calculate_confidence(predictions)
        }
    
    async def compute_control_action(self, state: dict):
        # PPO policy inference
        action = self.ppo.predict(state)
        return {
            "heating_duty": action[0],
            "ventilation_speed": action[1],
            "misting_duration": action[2],
            "shade_position": action[3]
        }
    
    async def detect_anomalies(self, readings: dict):
        # Isolation Forest inference
        X = vectorize_readings(readings)
        anomaly_score = self.iso_forest.decision_function(X)
        is_anomaly = anomaly_score < THRESHOLD
        return {"is_anomaly": is_anomaly, "score": anomaly_score}

# services/alert_service.py
class AlertService:
    async def check_alert_rules(self, site_id: str):
        # Fetch all active rules for site
        rules = self.postgres.query(
            f'SELECT * FROM alert_rules WHERE site_id={site_id} AND is_active=true'
        )
        
        # Get latest sensor data
        current_state = await self.sensor_service.get_latest_readings(site_id)
        
        # Evaluate each rule
        triggered_alerts = []
        for rule in rules:
            if evaluate_condition(rule.condition, current_state):
                alert = create_alert(rule, current_state)
                triggered_alerts.append(alert)
        
        # Dispatch notifications
        for alert in triggered_alerts:
            await self.notification_service.dispatch(alert)
        
        return triggered_alerts
```

---

### 2.4 Data Access Layer

**Database Abstraction:**

```python
# database.py
class DatabaseConnection:
    def __init__(self, db_url: str):
        self.engine = create_engine(db_url)
        self.SessionLocal = sessionmaker(bind=self.engine)
    
    async def get_session(self):
        db = self.SessionLocal()
        try:
            yield db
        finally:
            await db.close()

# repositories/sensor_repository.py
class SensorRepository:
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def get_sensor_by_id(self, sensor_id: str):
        return await self.session.query(Sensor).filter(Sensor.id == sensor_id).first()
    
    async def get_sensors_by_site(self, site_id: str):
        return await self.session.query(Sensor).filter(Sensor.site_id == site_id).all()
    
    async def update_sensor_calibration(self, sensor_id: str, calibration_date: datetime):
        sensor = await self.get_sensor_by_id(sensor_id)
        sensor.calibration_date = calibration_date
        await self.session.commit()
```

---

### 2.5 IoT Integration Layer

**MQTT Event Flow:**

```
┌─────────────────────────────────────────────┐
│  ESP32 Sensor (Temperature)                 │
│  Publishes every 5 seconds                  │
│  Topic: greenhouse/sensors/temperature      │
│  Payload: {"value": 24.5, "ts": "..."}      │
└────────────┬────────────────────────────────┘
             │
             ▼ (MQTT: QoS1)
┌─────────────────────────────────────────────┐
│  Mosquitto MQTT Broker (1883)               │
│  Subscribers:                               │
│  - Node-RED (automation workflows)          │
│  - FastAPI (data ingestion)                 │
│  - React (browser MQTT-over-WS)             │
└────────┬────────────────────────────────────┘
         │
    ┌────┴────┬────────────┬────────────┐
    │          │            │            │
    ▼          ▼            ▼            ▼
┌────────┐ ┌────────┐ ┌──────────┐ ┌─────────┐
│Node-RED│ │FastAPI │ │Dashboard │ │Local    │
│Workflow│ │Handler │ │WebSocket │ │Storage  │
└────────┘ └───┬────┘ └──────────┘ └─────────┘
             │
             ▼
        ┌──────────┐
        │InfluxDB  │
        │(persist) │
        └──────────┘
```

**Node-RED Workflow Example (Temperature Control):**

```
Input: mqtt (topic: greenhouse/sensors/temperature)
  │
  ▼
Function: Extract current temperature & setpoint
  │
  ├─ current_temp = msg.payload.value
  └─ setpoint = context.global.temp_setpoint (22°C)
  │
  ▼
Switch: Compare
  │
  ├─ if (current_temp < setpoint - 1°C)
  │   └─→ MQTT Output: Increase heating (duty_cycle=75%)
  │
  ├─ if (current_temp > setpoint + 1°C)
  │   └─→ MQTT Output: Increase ventilation (speed=60%)
  │
  └─ else
      └─→ MQTT Output: Maintain current state
  │
  ▼
Function: Log action to audit trail
  │
  ▼
HTTP POST: /api/actuator-commands (FastAPI logging)
```

---

### 2.6 Real-Time Communication

**WebSocket Architecture:**

```python
# main.py
from fastapi import WebSocket, WebSocketDisconnect
import asyncio
import json

# Track active connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, site_id: str):
        await websocket.accept()
        if site_id not in self.active_connections:
            self.active_connections[site_id] = []
        self.active_connections[site_id].append(websocket)
    
    def disconnect(self, websocket: WebSocket, site_id: str):
        self.active_connections[site_id].remove(websocket)
    
    async def broadcast(self, site_id: str, message: dict):
        """Send to all connected clients for a site"""
        for websocket in self.active_connections.get(site_id, []):
            try:
                await websocket.send_json(message)
            except Exception as e:
                print(f"Error broadcasting: {e}")

manager = ConnectionManager()

@app.websocket("/ws/dashboard")
async def websocket_endpoint(websocket: WebSocket):
    site_id = websocket.query_params.get("site_id")
    await manager.connect(websocket, site_id)
    
    try:
        while True:
            # Listen for client messages (optional)
            data = await websocket.receive_text()
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, site_id)

# Background task: Broadcast sensor updates every 5s
@app.on_event("startup")
async def startup_event():
    asyncio.create_task(broadcast_sensor_updates())

async def broadcast_sensor_updates():
    while True:
        for site_id in manager.active_connections.keys():
            readings = await sensor_service.get_latest_readings(site_id)
            await manager.broadcast(site_id, {
                "type": "sensor_update",
                "data": readings,
                "timestamp": datetime.now().isoformat()
            })
        await asyncio.sleep(5)
```

**Client-Side WebSocket (React):**

```javascript
// hooks/useWebSocket.js
import { useEffect, useState } from 'react';

export const useWebSocket = (siteId) => {
    const [data, setData] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    
    useEffect(() => {
        const ws = new WebSocket(
            `wss://api.greenhouse.io/ws/dashboard?site_id=${siteId}&token=${getJWT()}`
        );
        
        ws.onopen = () => setIsConnected(true);
        
        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'sensor_update') {
                setData(message.data);
            }
        };
        
        ws.onerror = (error) => console.error('WS error:', error);
        
        ws.onclose = () => setIsConnected(false);
        
        return () => ws.close();
    }, [siteId]);
    
    return { data, isConnected };
};

// Usage in component
function Dashboard() {
    const { data: sensors, isConnected } = useWebSocket(selectedSite);
    
    return (
        <div>
            <TemperatureGauge value={sensors?.temperature} />
            <HumidityGauge value={sensors?.humidity} />
            <StatusIndicator connected={isConnected} />
        </div>
    );
}
```

---

## 3. Data Flow Diagrams

### 3.1 Sensor Data Ingestion Flow

```
ESP32 Sensor
├─ Temperature: 24.5°C every 5s
├─ Humidity: 65% every 5s
├─ CO₂: 550 ppm every 10s
└─ Soil Moisture: 45% every 60s

    │
    ├─ MQTT Publish (QoS=1)
    │
    ▼
Mosquitto Broker
├─ Persist message
├─ Forward to subscribers
│
├─→ Node-RED
│   ├─ Transform payload
│   ├─ Validate ranges
│   └─ Forward to FastAPI HTTP endpoint
│
├─→ FastAPI /mqtt/sensor-reading (webhook)
│   ├─ Validate schema
│   ├─ Insert into InfluxDB
│   ├─ Update Redis cache (latest value)
│   └─ Broadcast to WebSocket clients
│
├─→ InfluxDB
│   ├─ Store in hot bucket (90 days)
│   └─ Trigger retention policy
│
├─→ WebSocket broadcast
│   └─ React component updates gauge
│
└─→ Local Node-RED storage (backup)

┌─────────────────────────────────────┐
│     Dashboard (Real-time)            │
│  - Temperature gauge: 24.5°C         │
│  - Humidity gauge: 65%               │
│  - 24h trend chart                   │
│  - Last update: 2 seconds ago        │
└─────────────────────────────────────┘
```

### 3.2 Alert Detection & Dispatch Flow

```
Anomaly Detection Service (runs every 60s)
  │
  ├─ Fetch last 10 sensor readings from InfluxDB
  │
  ├─ Vectorize readings
  │  └─ [temp, humidity, rate_of_change, std_dev, ...]
  │
  ├─ Run Isolation Forest model
  │  └─ anomaly_score = model.decision_function(X)
  │
  ├─ Check if score < -0.5 (threshold)
  │
  ├─ If anomaly detected:
  │  │
  │  ├─ Classify anomaly type
  │  │  ├─ Sensor drift → Notify technician
  │  │  ├─ Temp spike → Auto-increase ventilation
  │  │  ├─ Fungal risk → Reduce humidity setpoint
  │  │  └─ Power failure → Alert immediately
  │  │
  │  ├─ Create Alert object
  │  │  ├─ alert_id: UUID
  │  │  ├─ site_id: "greenhouse_01"
  │  │  ├─ type: "high_temperature"
  │  │  ├─ severity: "critical"
  │  │  └─ timestamp: "2026-06-15T14:30:00Z"
  │  │
  │  ├─ Store in PostgreSQL
  │  │  └─ INSERT INTO alerts (...)
  │  │
  │  ├─ Retrieve alert rules for site
  │  │
  │  ├─ Execute alert actions:
  │  │  ├─ CRITICAL
  │  │  │  ├─ SMS via Twilio (operator)
  │  │  │  ├─ Email via SendGrid (admin + operator)
  │  │  │  ├─ Push notification via FCM (mobile app)
  │  │  │  └─ In-app notification (WebSocket)
  │  │  │
  │  │  ├─ WARNING
  │  │  │  ├─ Email digest (collected, sent hourly)
  │  │  │  └─ In-app notification
  │  │  │
  │  │  └─ INFO
  │  │     └─ Log only
  │  │
  │  └─ Auto-mitigate (if configured)
  │     └─ MQTT publish: greenhouse/actuators/ventilation/cmd
  │        └─ {"fan_speed": 80} # Increase ventilation
  │
  └─ Log to audit trail
     └─ INSERT INTO audit_log (...)

┌─────────────────────────────┐
│  Operator's Phone (SMS)      │
│                             │
│  🚨 ALERT: Greenhouse 01     │
│  High Temperature: 32°C      │
│  Tap to respond             │
└─────────────────────────────┘

┌─────────────────────────────┐
│  Dashboard Alert Panel       │
│                             │
│  🔴 CRITICAL (2 min ago)     │
│  Temperature exceeded 30°C   │
│  □ Acknowledge  □ Snooze    │
└─────────────────────────────┘
```

### 3.3 ML Prediction & Control Flow

```
Scheduled Task: Every 10 minutes at :00, :10, :20, ...

1. LSTM Prediction
   ├─ Query InfluxDB: Last 48 sensor readings (5-min intervals)
   ├─ Preprocess
   │  ├─ Normalize each feature (z-score)
   │  ├─ Time encoding: sin(2π*hour/24), cos(2π*hour/24)
   │  └─ Create sequence: (batch=1, seq_len=48, features=12)
   ├─ Inference: lstm_model.predict(X)
   │  └─ Output shape: (1, 3) → [temp_2h, humidity_2h, soil_moisture_6h]
   ├─ Calculate confidence: 1 - std(predictions)
   └─ Store in Redis: {"pred_temp_2h": 26.5, "confidence": 0.87}

2. PPO Policy Evaluation
   ├─ Get current state
   │  ├─ temp: 25.0, setpoint: 22.0
   │  ├─ humidity: 65%, setpoint: 60%
   │  ├─ light: 800 lux
   │  ├─ soil_moisture: 45%
   │  └─ time_of_day: 14 (2 PM)
   ├─ Normalize state to [0, 1] range
   ├─ Call PPO agent: action = policy.predict(state)
   │  ├─ Output: [heating_duty=0.3, ventilation=0.6, misting=0.0, shade=0.0]
   │  └─ Denormalize: [heating=30%, ventilation=60%, ...]
   ├─ Compare with rule-based control
   │  └─ Rule: temp > setpoint → heat off, vent on
   └─ Deploy if performance > baseline
      └─ MQTT publish: greenhouse/control/policy_action
         ├─ heating_duty: 30%
         ├─ ventilation_speed: 60%
         ├─ misting_duration: 0
         └─ triggered_by: "rl_policy"

3. Anomaly Detection Scores
   ├─ Vectorize current readings
   ├─ Isolation Forest: anomaly_score = model.decision_function(X)
   ├─ Flag if score < CRITICAL_THRESHOLD (-0.7)
   └─ Store scores in InfluxDB for trend analysis

Result: Dashboard displays
├─ Next 2h temperature prediction: 26.5°C
├─ Confidence: 87%
├─ Recommended actions:
│  ├─ Reduce heating to 30% (save energy)
│  └─ Increase ventilation to 60% (cool down)
└─ Auto-implemented (if policy enabled)
```

---

## 4. Deployment Architecture

### 4.1 Development Environment
```
Developer Laptop
├─ Docker Desktop
│  ├─ PostgreSQL container
│  ├─ InfluxDB container
│  ├─ Redis container
│  ├─ Mosquitto container
│  └─ Node-RED container
├─ Backend
│  └─ FastAPI dev server (localhost:8000)
├─ Frontend
│  └─ Vite dev server (localhost:5173)
└─ ML Models
   └─ TensorFlow/scikit-learn (local)
```

### 4.2 Staging Environment
```
Railway (Backend Staging)
├─ PostgreSQL (managed)
├─ FastAPI app
└─ InfluxDB (managed)

Vercel (Frontend Staging)
└─ React app (preview.greenhouse-controller.vercel.app)

External Services
├─ Mosquitto (EC2 instance)
├─ Node-RED (EC2 instance)
└─ Mock IoT devices (Simulator)
```

### 4.3 Production Environment
```
┌─────────────────────────────────────────────────────┐
│  Production Infrastructure                          │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │ Frontend: Vercel                             │   │
│  │ - React App (CDN cached globally)            │   │
│  │ - Analytics (Vercel Analytics)               │   │
│  │ - Cron jobs (report generation)              │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │ Backend: Railway                             │   │
│  │ - FastAPI (auto-scaled, 2-5 instances)      │   │
│  │ - PostgreSQL (managed, automated backups)    │   │
│  │ - InfluxDB (managed, time-series optimized) │   │
│  │ - Redis (managed, session store & cache)    │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │ IoT & Automation: AWS EC2                    │   │
│  │ - Mosquitto MQTT Broker (t3.small)           │   │
│  │ - Node-RED (containerized)                   │   │
│  │ - Auto-scaling group (2-4 instances)         │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │ Notifications:                               │   │
│  │ - SendGrid (email)                           │   │
│  │ - Twilio (SMS)                               │   │
│  │ - Firebase Cloud Messaging (push)            │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │ Monitoring & Logging:                        │   │
│  │ - Sentry (error tracking)                    │   │
│  │ - Datadog (infrastructure metrics)           │   │
│  │ - ELK Stack (logs)                           │   │
│  │ - Grafana (dashboards)                       │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘

IoT Devices in Field
├─ ESP32 sensors (100-500 units)
│  └─ MQTT over 4G/WiFi to Mosquitto
├─ Relay controllers (10-50 units)
│  └─ Subscribe to control commands
└─ Gateway (local edge device)
   └─ Backup local processing if cloud unavailable
```

---

## 5. Scalability & Load Distribution

### 5.1 Horizontal Scaling

**FastAPI Backend:**
- Railway auto-scaling: 2-5 instances based on CPU/memory
- Load balancer distributes requests
- Stateless design (JWT tokens, Redis sessions)

**Database:**
- PostgreSQL: Master-replica setup (Standby for HA)
- InfluxDB: Clustering (if high-volume sensor data >10k/sec)
- Redis: Single instance with RDB snapshots (upgrade to Cluster if needed)

**MQTT Broker:**
- Mosquitto instances behind AWS NLB (Network Load Balancer)
- Topic-based sharding: greenhouse/site-{1-10}/...

### 5.2 Caching Strategy

**Redis Cache Tiers:**

| Data | Key Pattern | TTL | Update Frequency |
|------|-------------|-----|------------------|
| Latest sensor readings | `sensor:{site}:{id}:latest` | 5 min | Every 5s |
| Aggregated hourly stats | `stats:{site}:{hour}` | 24h | Once/hour |
| User permissions | `user:{id}:permissions` | 8h | On change |
| ML model predictions | `pred:{site}:next-24h` | 15 min | Every 10m |

**Cache Invalidation:**
```python
# On sensor update, invalidate cache
async def on_sensor_update(sensor_id: str, value: float):
    await redis.delete(f"sensor:{site_id}:{sensor_id}:latest")
    await cache_manager.broadcast(f"sensor_updated:{sensor_id}")
```

---

## 6. Disaster Recovery

### 6.1 Backup & Restore

**Database Backups:**
- PostgreSQL: Automated daily snapshots, 30-day retention
- InfluxDB: Continuous replication + nightly backups
- Recovery Time Objective (RTO): 1 hour
- Recovery Point Objective (RPO): 1 hour

**Configuration Backups:**
- Alert rules, user settings: Stored in git repo (Infrastructure as Code)
- ML models: Stored in Railway artifacts (versioned)

### 6.2 High Availability Setup

```
┌───────────────┐
│ Vercel CDN    │ ← Frontend globally distributed
└───────────────┘

┌──────────────────────────────────────┐
│ Railway Multi-Region Setup           │
├──────────────┬──────────────────────┤
│ US Region    │ EU Region (future)   │
│ - API 1      │ - API 2              │
│ - API 2      │ - API 3              │
│ - API 3      │                      │
└──────────────┴──────────────────────┘

Database Failover:
├─ Primary: PostgreSQL (US)
└─ Replica: PostgreSQL (standby, auto-promote on failure)

MQTT Broker Redundancy:
├─ Primary: Mosquitto (EC2 - us-east-1)
└─ Secondary: Mosquitto (EC2 - us-west-2, manual failover)
```

---

## 7. Security Architecture

### 7.1 Network Security

```
┌──────────────────────────────────────────┐
│ Internet                                 │
└───────────────┬──────────────────────────┘
                │
        ┌───────▼────────┐
        │ CloudFlare DDoS │ ← DDoS protection
        │ Protection      │
        └───────┬────────┘
                │
        ┌───────▼──────────┐
        │ HTTPS/TLS 1.3    │ ← Encrypted transport
        └───────┬──────────┘
                │
        ┌───────▼──────────────────────┐
        │ API Gateway (Auth Middleware)│
        │ - JWT validation             │
        │ - CORS check                 │
        │ - Rate limiting              │
        └───────┬──────────────────────┘
                │
        ┌───────▼────────────────────┐
        │ Application Layer           │
        │ - Role-based access control │
        │ - Input validation          │
        │ - SQL injection prevention  │
        └───────┬────────────────────┘
                │
        ┌───────▼──────────────────┐
        │ Database                 │
        │ - Password hashing       │
        │ - Data encryption at rest│
        │ - Audit logging          │
        └──────────────────────────┘
```

### 7.2 API Security

**Authentication Flow:**
```
1. User submits credentials (email + password)
   └─ POST /api/auth/login

2. Backend:
   ├─ Query PostgreSQL: Find user
   ├─ bcrypt.verify(password, hash) → Success
   └─ Generate JWT token (expires 15 min)

3. Response:
   {
     "access_token": "eyJhbGciOiJIUzI1NiIs...",
     "token_type": "bearer",
     "expires_in": 900
   }

4. Client stores token in localStorage (or secure storage)

5. Subsequent requests:
   GET /api/sensors/current
   Header: Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

6. Backend middleware:
   ├─ Extract token from header
   ├─ Verify signature & expiry
   └─ Extract user_id, role → add to request context
```

**MQTT Security:**
```
Sensors ← TLS certificate (self-signed for dev, CA-signed for prod)
         └─ MQTT over port 8883 (TLS)

Payload: {"value": 24.5, "sensor_id": "temp_01", "sig": "HMAC-SHA256"}
         └─ Optional: Message signing to prevent tampering

Broker Authentication:
└─ Username/password (stored in mosquitto ACL file)
   user: esp32_sensor_01
   pass: hashed_password
```

---

## 8. Architecture Decisions & Justifications

| Decision | Why |
|----------|-----|
| **FastAPI** (not Django/Flask) | Async by default, fast performance, modern Python |
| **PostgreSQL + InfluxDB** (not single DB) | Relational for metadata, time-series for sensor data |
| **MQTT** (not REST polling) | Event-driven, low latency, efficient for IoT |
| **WebSocket** (not polling) | Real-time updates, reduced server load |
| **Isolation Forest** (not statistical outliers) | Scales to high dimensions, no parameter tuning |
| **PPO** (not Q-learning) | Stable training, better sample efficiency |
| **Railway** (not self-hosted) | Managed services, auto-scaling, less ops overhead |
| **Vercel** (not self-hosted frontend) | Global CDN, serverless functions, zero-config |

---

**Document Version:** 1.0  
**Last Updated:** June 2026  
**Owner:** Lazy (B.E. CSE AI&ML, PES Mandya)
