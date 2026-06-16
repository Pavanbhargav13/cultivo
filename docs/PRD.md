# Automated Greenhouse Controller - Product Requirements Document (PRD)

## 1. Executive Summary

The Automated Greenhouse Controller is an intelligent environmental management system that uses machine learning, IoT sensors, and automation workflows to optimize growing conditions in greenhouse environments. The system predicts environmental parameters, detects anomalies, and automatically adjusts HVAC/irrigation systems in real-time.

**Target Users:** Greenhouse operators, agricultural researchers, sustainability-focused farmers  
**MVP Timeline:** 8 weeks  
**Success Metrics:** 95%+ uptime, <2min sensor-to-action latency, 20-30% resource optimization

---

## 2. Product Vision

Enable greenhouse operators to achieve optimal plant growth conditions with minimal manual intervention through AI-driven predictive control and real-time monitoring, reducing resource waste by 25-30% while maintaining crop quality.

---

## 3. User Personas & Use Cases

### Persona 1: Raj Kumar (Greenhouse Operator)
- **Role:** Manages 500m² greenhouse operation
- **Pain:** Manual temperature/humidity adjustments 4x daily, frequent crop loss
- **Goal:** Automate climate control, improve consistency, reduce labor
- **Use Case:** Set desired crop profile (e.g., tomato, optimal temp 22-26°C) → system auto-adjusts heating, ventilation, misting

### Persona 2: Dr. Priya (Agricultural Researcher)
- **Role:** Experiments with different cultivars and growing conditions
- **Pain:** Manual data logging, cannot correlate environmental factors with yield
- **Goal:** Real-time insights into how microclimate affects plant health
- **Use Case:** Compare crop performance across two identical zones with different climate setpoints; export 30-day reports

### Persona 3: Farm Manager (Multi-Site)
- **Role:** Oversees 3-5 greenhouse locations
- **Pain:** Cannot monitor multiple sites simultaneously, delayed alerts mean crop loss
- **Goal:** Centralized dashboard, instant notifications of anomalies
- **Use Case:** Receive SMS/push alert when CO₂ drops below threshold; one-click remote actuation

---

## 4. Core Features

### 4.1 Real-Time Environmental Monitoring
**Requirement:** Ingest sensor data every 5 seconds from MQTT broker  
**Sensors Monitored:**
- Temperature (interior, exterior)
- Humidity (relative %)
- CO₂ concentration (ppm)
- Light intensity (lux)
- Soil moisture (%)
- Soil EC (electrical conductivity)

**UI Components:**
- Live gauge widgets (temperature, humidity)
- Time-series charts (24h, 7d, 30d views)
- Last-updated timestamp for each sensor
- Data quality indicator (connection status)

**Acceptance Criteria:**
- Sensor data displays within 10 seconds of collection
- Historical data retained for 90 days
- Missing data points handled gracefully (interpolation or flagged)

---

### 4.2 Predictive Environmental Control (LSTM)
**Requirement:** Predict future environmental parameters to proactively adjust HVAC/irrigation  
**ML Model:** LSTM neural network trained on historical greenhouse data  

**Predictions:**
- Temperature 2-6 hours ahead
- Humidity 2-4 hours ahead
- Soil moisture depletion rate

**Feature Engineering:**
- Time-of-day encoding (sine/cosine transforms)
- Historical rolling averages (1h, 6h, 24h)
- External weather data (API-sourced)
- System actuator state (heating on/off, fan speed)

**Model Serving:** FastAPI endpoint (`/predict`) returning JSON with:
```json
{
  "timestamp": "2026-06-15T14:30:00Z",
  "predictions": {
    "temperature_2h": 26.5,
    "humidity_2h": 65,
    "soil_moisture_6h": 45
  },
  "confidence_intervals": { ... }
}
```

**Acceptance Criteria:**
- RMSE < 2°C for temperature predictions
- Model retraining scheduled weekly
- Fallback to rule-based control if prediction confidence < 70%

---

### 4.3 Reinforcement Learning Policy (PPO)
**Requirement:** Learn optimal control policies that minimize energy while maintaining setpoints  
**RL Framework:** Stable-Baselines3 PPO (Proximal Policy Optimization)

**Agent Action Space:**
- Heating duty cycle (0-100%)
- Ventilation fan speed (0-100%)
- Misting system (on/off/duration)
- Shade deployment (0-100% closed)

**Reward Function:**
```
Reward = 
  + 10 * (1 - |T_current - T_setpoint|/10)      # Temperature error penalty
  + 5 * (1 - |H_current - H_setpoint|/20)       # Humidity error penalty
  - 0.1 * (heating_duty + ventilation_duty)     # Energy penalty
  - 0.05 * (misting_duration)                   # Water penalty
  - 20 * (anomaly_detected)                     # Anomaly penalty
```

**Training Loop:**
- Runs daily on previous 24h data
- New policy deployed if performance > baseline
- Rollback mechanism if performance degrades

**UI Component:**
- Policy performance dashboard (energy saved %, comfort metric)
- A/B comparison: rule-based vs. learned policy

**Acceptance Criteria:**
- 15-20% energy reduction vs. baseline rule-based control
- Temperature maintained within ±1.5°C of setpoint 90% of time
- Policy update mechanism operational (manual review before deployment)

---

### 4.4 Anomaly Detection (Isolation Forest)
**Requirement:** Detect sensor failures, system malfunctions, pest/disease outbreaks  
**Algorithm:** Isolation Forest (unsupervised)

**Anomaly Types Detected:**
1. **Sensor Drift:** Temperature sensor gradually off by >3°C
2. **Abrupt Failures:** Humidity sensor reporting 0% for >10 min
3. **Environmental Anomalies:** Sudden temp spike (fire risk), CO₂ crash (ventilation failure)
4. **Biotic Anomalies:** Leaf wetness + high humidity + temp 18-24°C (fungal outbreak risk)

**Features for Anomaly Detection:**
- Raw sensor values
- Rate of change (delta per minute)
- Multivariate relationships (temp vs. humidity correlation)
- Historical patterns (compare to same hour last week)

**Thresholds:**
- Critical (red alert): Immediate SMS + push notification + email + auto-mitigation
- Warning (yellow alert): Dashboard notification + log
- Info: Log only

**Auto-Mitigation Examples:**
- Sensor failure detected → switch to backup sensor + alert technician
- CO₂ low → increase ventilation fan by 20%
- Fungal outbreak risk → reduce misting, increase ventilation, lower humidity setpoint

**Acceptance Criteria:**
- F1-score > 0.85 on labeled test set
- <2% false positive rate (critical alerts)
- Alert delivered within 30 seconds of anomaly detection

---

### 4.5 MQTT-Based IoT Integration
**Requirement:** Real-time bidirectional communication with sensors and actuators  

**Architecture:**
- MQTT Broker (Mosquitto on Node-RED)
- Sensor publishers (ESP32 devices)
- Actuator subscribers (relay controllers)

**Topic Structure:**
```
greenhouse/sensors/temperature        → { value: 24.5, unit: "°C", timestamp: "..." }
greenhouse/sensors/humidity           → { value: 65, unit: "%", timestamp: "..." }
greenhouse/sensors/soil_moisture      → { value: 45, unit: "%", timestamp: "..." }
greenhouse/actuators/heating/command  ← { duty_cycle: 75 }
greenhouse/actuators/ventilation/cmd  ← { fan_speed: 80 }
greenhouse/actuators/misting/command  ← { duration_sec: 30, interval_min: 15 }
```

**QoS Levels:**
- Sensors: QoS 1 (at least once)
- Actuators: QoS 2 (exactly once)

**Node-RED Workflows:**
- Temperature control loop (PID controller)
- Humidity management
- Soil moisture threshold-based irrigation
- Manual override handling

**Acceptance Criteria:**
- <100ms latency from sensor to MQTT broker
- 99.5%+ message delivery rate
- Graceful degradation if broker unavailable (local fallback)

---

### 4.6 Cloud Data Pipeline (FastAPI + PostgreSQL + InfluxDB)
**Requirement:** Scalable, time-series optimized data storage and retrieval  

**Architecture:**
```
MQTT Broker 
  → Node-RED (transform/validate) 
  → FastAPI (ingest) 
  → [PostgreSQL (metadata) + InfluxDB (time-series)]
  → React Dashboard (query via API)
```

**Data Models:**

**PostgreSQL (Metadata):**
- Users, sites, sensor configs
- Alert rules, anomaly logs
- Control policies (PPO), deployment history

**InfluxDB (Time-Series):**
- Sensor readings (optimized for millions of datapoints)
- Actuator commands (audit trail)
- System metrics (uptime, latency)

**FastAPI Endpoints:**

1. **GET /sensors/current**
   - Returns latest reading from all sensors
   - Response time: <500ms

2. **GET /sensors/{sensor_id}/history?start=&end=&interval=1h**
   - Returns aggregated data (mean, min, max, std)
   - Supports multiple intervals (1m, 5m, 1h, 1d)

3. **POST /control/actuator**
   - Manual actuator control (heating, ventilation, misting)
   - Requires authentication, logs all commands

4. **GET /anomalies?days=7**
   - Returns anomalies in last N days with severity

5. **GET /predictions/next-24h**
   - LSTM predictions with confidence intervals

6. **GET /reports/energy-usage**
   - Daily/weekly energy consumption breakdown

**Acceptance Criteria:**
- Query latency for 30-day window: <2 seconds
- Data retention: 90 days hot (fast access), 2 years cold (archive)
- Backup cadence: Daily snapshots

---

### 4.7 Real-Time Dashboard (React + Grafana)
**Requirement:** Intuitive, responsive dashboard for monitoring and control  

**Dashboard Layouts:**

**Layout 1: Operator View (Main)**
- Large gauge: Current temperature (color-coded)
- Large gauge: Current humidity
- Setpoint controls (quick adjust ±1°C, ±5%)
- Live chart: 24h temperature, humidity, CO₂
- Alert panel (auto-scroll, color-coded)
- Quick actions: Manual heat, vent, mist buttons

**Layout 2: Researcher View (Analytics)**
- Correlation heatmap (temp vs. soil moisture vs. yield, etc.)
- Comparison view (two time periods side-by-side)
- Export buttons (CSV, JSON, PDF report)
- Custom date range picker

**Layout 3: Remote Manager View (Mobile-Friendly)**
- Site selector dropdown
- Key metrics KPI cards (current temp, status, last alert)
- Alert/notification feed
- One-tap emergency controls

**Real-Time Updates:**
- WebSocket connection for live data (via FastAPI Starlette)
- Update frequency: 5-10 seconds for gauges, 1 second for alerts
- Graceful reconnection with local state caching

**Grafana Panels:**
- Time-series panel (temperature trends)
- Heatmap (hourly patterns)
- Stat panel (current KPIs)
- Table (alert history)

**Acceptance Criteria:**
- Page load: <2 seconds
- Data update latency: <10 seconds
- Responsive on mobile (375px width)
- Accessibility (WCAG AA compliance)

---

### 4.8 Alert & Notification System
**Requirement:** Multi-channel alerts for critical events  

**Alert Channels:**
- In-app notifications (dashboard)
- SMS (via Twilio) for critical alerts
- Email (daily digest, per-alert)
- Push notifications (mobile app)

**Alert Rules Engine:**
```json
{
  "rule_id": "temp_critical_high",
  "trigger": "temperature > 30°C for 5 minutes",
  "severity": "critical",
  "actions": [
    { "type": "sms", "recipients": ["+91-XXXX"] },
    { "type": "email", "recipients": ["raj@farm.com"] },
    { "type": "auto_mitigation", "action": "increase_ventilation_50%" }
  ]
}
```

**User Preferences:**
- Notification quiet hours (e.g., 10 PM - 6 AM, except critical)
- Alert suppression (snooze for 1h, 6h, 24h)
- Custom rule creation (Advanced mode)

**Acceptance Criteria:**
- Alert delivered within 2 minutes of trigger
- SMS delivery rate: >99%
- User can customize alert rules
- Audit log of all alerts + actions

---

### 4.9 Historical Data Export & Reporting
**Requirement:** Generate reports for compliance, analysis, and optimization  

**Report Types:**

1. **Daily Operations Report**
   - Summary stats (avg temp, humidity, CO₂)
   - Anomalies detected
   - Actuator usage (cumulative duty cycles)
   - Energy consumed

2. **Weekly Performance Report**
   - Trend analysis (improving/degrading)
   - PPO policy performance (energy saved vs. baseline)
   - Top anomalies

3. **Compliance Report** (for certifications)
   - Temperature/humidity stayed within range X% of time
   - All sensors calibrated on date X
   - Audit trail of manual overrides

4. **Custom Report Builder**
   - Select metrics, date range, aggregation level
   - Add notes/annotations
   - Export as PDF, CSV, JSON

**Acceptance Criteria:**
- Report generation: <30 seconds for 30-day window
- PDF includes charts, tables, summary metrics
- Scheduling support (auto-generate daily/weekly)

---

### 4.10 Multi-Site Management
**Requirement:** Manage multiple greenhouses from unified dashboard  

**Features:**
- Site selector (dropdown / card grid)
- Alerts aggregated across sites
- Comparative analytics (which site is most efficient)
- Batch controls (apply policy to multiple sites)

**Acceptance Criteria:**
- Support 5-10 sites per user account
- Site switching: <1 second
- Alerts clearly labeled by site

---

## 5. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| **Uptime** | 99.5% monthly |
| **Latency (Sensor → Dashboard)** | <10 seconds |
| **Latency (Alert → User)** | <2 minutes |
| **Concurrent Users per Site** | 10 simultaneous connections |
| **Data Retention** | 90 days hot, 2 years cold |
| **Backup Frequency** | Daily incremental, weekly full |
| **Disaster Recovery** | RTO 4h, RPO 1h |
| **Security** | TLS 1.3, JWT auth, role-based access control |
| **Scalability** | Support 500+ sensors per site |

---

## 6. Success Metrics & KPIs

1. **Operational Efficiency**
   - Energy consumption reduction: 20-30% vs. manual operation
   - Water savings: 15-25%
   - Labor hours: 50% reduction in manual adjustments

2. **Reliability**
   - System uptime: >99.5%
   - Unplanned downtime: <4 hours/month
   - Sensor failure detection: <5 min

3. **Crop Quality**
   - Temperature consistency: ±1.5°C of setpoint 90% of time
   - Humidity consistency: ±5% of setpoint 85% of time
   - Anomaly-free growing periods: >95% days

4. **User Adoption**
   - Time to proficiency: <1 day of training
   - Feature adoption rate: >80% within 4 weeks
   - User satisfaction (NPS): >70

---

## 7. Development Phases

### Phase 1: MVP (Weeks 1-4)
- Real-time monitoring (sensors + MQTT + basic dashboard)
- Manual control (heating, ventilation, misting)
- Basic anomaly detection (threshold-based)
- Email alerts

### Phase 2: Intelligence (Weeks 5-6)
- LSTM predictor integration
- PPO policy training & deployment
- Advanced anomaly detection (Isolation Forest)
- SMS/push alerts

### Phase 3: Scale & Polish (Weeks 7-8)
- Multi-site support
- Report generation
- Mobile app optimization
- Production deployment (Docker + Railway/Vercel)

---

## 8. Technical Constraints

- **Browser Support:** Chrome, Firefox, Safari (latest 2 versions)
- **Mobile:** iOS 14+, Android 10+
- **MQTT Broker:** Mosquitto (open-source)
- **ML Framework:** scikit-learn (Isolation Forest), TensorFlow/Keras (LSTM)
- **Backend:** FastAPI (Python 3.10+)
- **Database:** PostgreSQL 14+, InfluxDB 2.x
- **Frontend:** React 18+ with Vite
- **Deployment:** Docker, Railway (backend), Vercel (frontend)

---

## 9. Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Sensor failures | High | Redundant sensors, automated fallback, technician alerts |
| Network downtime | High | Local control mode (Node-RED), queued MQTT messages |
| LSTM overfitting | Medium | Cross-validation, weekly retraining, fallback to rules |
| Actuator malfunction | High | Command logging, manual override, status feedback |
| Data privacy breach | High | Encryption (TLS), hashed passwords, audit logs |

---

## 10. Success Definition

The Automated Greenhouse Controller is successful when:
1. ✅ Deployed in production handling 500+ sensors continuously
2. ✅ Reduces energy consumption by 20-30% compared to baseline
3. ✅ Maintains target environment within ±1.5°C (temp) 90% of time
4. ✅ User adoption rate >80% within 4 weeks of deployment
5. ✅ System uptime 99.5%+ monthly
6. ✅ Zero critical security incidents in first 90 days

---

**Document Version:** 1.0  
**Last Updated:** June 2026  
**Owner:** Lazy (B.E. CSE AI&ML, PES Mandya)
