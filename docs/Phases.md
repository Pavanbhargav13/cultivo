# Automated Greenhouse Controller - Development Phases

## Phase 1: MVP (Weeks 1-4)
**Goal:** Establish the foundational backend, database, and real-time monitoring capabilities.
- Real-time monitoring (sensors + basic dashboard API)
- Backend data models and ingestion endpoints (`/sensors/data`)
- Manual control via endpoints (heating, ventilation, misting)
- Basic anomaly detection (threshold-based alerts)
- SQLite database implementation for easy local setup and testing
- Email/Log-based alerts

## Phase 2: Intelligence (Weeks 5-6)
**Goal:** Introduce predictive capabilities and machine learning models.
- Migrate database to PostgreSQL & InfluxDB
- Integrate LSTM predictor for forecasting environmental parameters
- Implement PPO (Proximal Policy Optimization) policy training & deployment
- Advance anomaly detection using Isolation Forest
- Implement SMS/push alerts (e.g., via Twilio)

## Phase 3: Scale & Polish (Weeks 7-8)
**Goal:** Finalize the application for production use across multiple sites.
- Implement multi-site support
- Add report generation (PDF, CSV exports)
- Mobile app optimization for the frontend
- Production deployment (Docker + Railway/Vercel)
- Establish real MQTT broker (Mosquitto) replacing simulated HTTP endpoints
