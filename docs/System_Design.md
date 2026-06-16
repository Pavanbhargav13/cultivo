# Automated Greenhouse Controller - System Design

## 1. Detailed Component Design

### 1.1 Sensor Module Design

**Sensor Hardware:**
- **ESP32 Microcontroller** (WiFi + Bluetooth)
  - ADC (Analog-to-Digital Converter): 12-bit, 0-4095 resolution
  - Power: 80mA typical, 5V DC
  - WiFi: 802.11 b/g/n (2.4GHz)

**Sensor Types & Calibration:**

```python
class SensorCalibration:
    """
    Each sensor type requires specific calibration
    Linear transformation: actual_value = raw_adc * slope + intercept
    """
    
    CALIBRATIONS = {
        "temperature": {
            "sensor": "DHT22",
            "adc_min": 0,
            "adc_max": 4095,
            "physical_min": -40,
            "physical_max": 80,
            "unit": "°C",
            "accuracy": ±0.5,
            "update_interval_sec": 5,
            "slope": (80 - (-40)) / (4095 - 0),
            "intercept": -40
        },
        "humidity": {
            "sensor": "DHT22",
            "physical_min": 0,
            "physical_max": 100,
            "unit": "%",
            "accuracy": ±2%,
            "update_interval_sec": 5
        },
        "soil_moisture": {
            "sensor": "Capacitive sensor",
            "adc_min": 500,  # Dry
            "adc_max": 3000,  # Wet
            "physical_min": 0,
            "physical_max": 100,
            "unit": "%",
            "update_interval_sec": 60
        },
        "co2": {
            "sensor": "MH-Z19B",
            "physical_min": 0,
            "physical_max": 5000,
            "unit": "ppm",
            "warm_up_time_sec": 60,
            "accuracy": ±50 ppm,
            "update_interval_sec": 10
        },
        "light_intensity": {
            "sensor": "BH1750",
            "physical_min": 0,
            "physical_max": 65535,
            "unit": "lux",
            "resolution": "0.5 lux",
            "update_interval_sec": 30
        }
    }

def calibrate_sensor(adc_reading: int, sensor_type: str) -> float:
    """Convert raw ADC reading to physical value"""
    cal = CALIBRATIONS[sensor_type]
    normalized = (adc_reading - cal['adc_min']) / (cal['adc_max'] - cal['adc_min'])
    physical = normalized * (cal['physical_max'] - cal['physical_min']) + cal['physical_min']
    return round(physical, 2)
```

**ESP32 Firmware Logic:**

```cpp
#include <PubSubClient.h>
#include <DHT.h>

const int TEMP_PIN = 32;
const int HUMIDITY_PIN = 32;
const int MOISTURE_PIN = 34;

DHT dht(HUMIDITY_PIN, DHT22);
WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

const char* mqtt_broker = "mosquitto.greenhouse.io";
const int mqtt_port = 8883;

void setup() {
    Serial.begin(115200);
    
    // Initialize sensors
    dht.begin();
    analogReadResolution(12);  // 12-bit ADC
    
    // Connect to WiFi
    WiFi.begin("SSID", "PASSWORD");
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    
    // Connect to MQTT
    mqttClient.setServer(mqtt_broker, mqtt_port);
    mqttClient.setCallback(onMessageReceived);
    reconnectMQTT();
}

void loop() {
    if (!mqttClient.connected()) {
        reconnectMQTT();
    }
    mqttClient.loop();
    
    // Read sensors every 5 seconds
    static unsigned long lastReadTime = 0;
    if (millis() - lastReadTime >= 5000) {
        lastReadTime = millis();
        
        float temperature = dht.readTemperature();
        float humidity = dht.readHumidity();
        int moisture_raw = analogRead(MOISTURE_PIN);
        float soil_moisture = map(moisture_raw, 500, 3000, 0, 100);
        
        // Create JSON payload
        StaticJsonDocument<256> doc;
        doc["temperature"] = temperature;
        doc["humidity"] = humidity;
        doc["soil_moisture"] = soil_moisture;
        doc["timestamp"] = millis();
        doc["sensor_id"] = "esp32_greenhouse_01";
        
        // Publish to MQTT
        String payload;
        serializeJson(doc, payload);
        mqttClient.publish("greenhouse/sensors/combined", payload.c_str());
    }
}

void reconnectMQTT() {
    while (!mqttClient.connected()) {
        if (mqttClient.connect("ESP32_GH01", "user", "pass")) {
            Serial.println("MQTT connected");
            mqttClient.subscribe("greenhouse/actuators/control");
        } else {
            delay(5000);
        }
    }
}

void onMessageReceived(char* topic, byte* payload, unsigned int length) {
    // Handle incoming actuator commands
    // e.g., {"heating": 75, "ventilation": 50}
}
```

---

### 1.2 Data Ingestion Pipeline Design

**Message Flow:**

```
ESP32 publishes every 5 seconds:
{
  "sensor_id": "esp32_greenhouse_01",
  "temperature": 24.5,
  "humidity": 65.2,
  "soil_moisture": 45.8,
  "timestamp": 1718520000000,
  "battery_voltage": 4.2
}

↓ MQTT Broker (Mosquitto)

↓ FastAPI handler receives webhook:

POST /api/mqtt/sensor-reading
{
  "topic": "greenhouse/sensors/combined",
  "payload": {...},
  "timestamp": 1718520000000
}

↓ FastAPI processes:

1. Validate schema
2. Check rate limits (max 10 readings/min per sensor)
3. Transform:
   - Convert timestamp to UTC
   - Validate ranges (temp: -40 to 80°C, humidity: 0-100%)
   - Round to 2 decimal places
4. Store in InfluxDB
5. Update Redis cache (sensor:esp32_greenhouse_01:latest)
6. Broadcast to WebSocket clients
7. Check anomaly detection rules
8. Log to PostgreSQL (optional, for audit)
```

**Data Validation:**

```python
from pydantic import BaseModel, validator, Field

class SensorReading(BaseModel):
    sensor_id: str = Field(..., min_length=3, max_length=100)
    temperature: float = Field(..., ge=-40, le=80)
    humidity: float = Field(..., ge=0, le=100)
    soil_moisture: float = Field(..., ge=0, le=100)
    co2: Optional[float] = Field(None, ge=0, le=5000)
    light_intensity: Optional[float] = Field(None, ge=0)
    timestamp: int  # Unix milliseconds
    
    @validator('timestamp')
    def validate_timestamp(cls, v):
        # Reject readings older than 1 hour
        now = int(datetime.now().timestamp() * 1000)
        if abs(now - v) > 3600000:
            raise ValueError('Timestamp too old')
        return v
    
    class Config:
        example = {
            "sensor_id": "esp32_greenhouse_01",
            "temperature": 24.5,
            "humidity": 65.2,
            "soil_moisture": 45.8,
            "timestamp": 1718520000000
        }

@router.post("/mqtt/sensor-reading")
async def ingest_sensor_reading(reading: SensorReading):
    """Ingest sensor data from MQTT webhook"""
    
    try:
        # Write to InfluxDB
        await influxdb_client.write_point(
            measurement="sensor_reading",
            tags={
                "sensor_id": reading.sensor_id,
                "sensor_type": "temperature",  # Derived from sensor_id
                "site_id": extract_site_id(reading.sensor_id)
            },
            fields={
                "value": reading.temperature,
                "unit": "°C"
            },
            timestamp=reading.timestamp
        )
        
        # Update cache
        cache_key = f"sensor:{reading.sensor_id}:latest"
        await redis.set(
            cache_key,
            json.dumps({
                "value": reading.temperature,
                "timestamp": reading.timestamp
            }),
            ex=300  # 5-minute TTL
        )
        
        # Broadcast to WebSocket
        await manager.broadcast(
            site_id=extract_site_id(reading.sensor_id),
            message={
                "type": "sensor_update",
                "sensor_id": reading.sensor_id,
                "value": reading.temperature,
                "timestamp": reading.timestamp
            }
        )
        
        # Check anomalies
        anomaly_result = await anomaly_service.detect(reading)
        if anomaly_result["is_anomaly"]:
            alert = await alert_service.create_alert(
                sensor_id=reading.sensor_id,
                anomaly_type=anomaly_result["type"],
                severity="warning"
            )
        
        return {"status": "success", "sensor_id": reading.sensor_id}
    
    except Exception as e:
        logger.error(f"Failed to ingest reading: {e}")
        raise HTTPException(status_code=500, detail="Ingestion failed")
```

---

### 1.3 ML Pipeline Design

#### LSTM Predictor

**Training Pipeline:**

```python
import pandas as pd
import numpy as np
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from sklearn.preprocessing import StandardScaler

class LSTMPredictor:
    def __init__(self, model_path: str = None):
        self.model = self._build_model()
        if model_path:
            self.model.load_weights(model_path)
        self.scaler = StandardScaler()
    
    def _build_model(self):
        model = Sequential([
            LSTM(128, return_sequences=True, input_shape=(48, 12)),
            Dropout(0.2),
            LSTM(64, return_sequences=False),
            Dropout(0.2),
            Dense(32, activation='relu'),
            Dense(3)  # Output: [temp_2h, humidity_2h, soil_moisture_6h]
        ])
        model.compile(optimizer='adam', loss='mse', metrics=['mae'])
        return model
    
    def prepare_features(self, sensor_history: List[dict]) -> np.ndarray:
        """
        Transform 48 historical readings into 12-feature array
        
        Features:
        0. temperature (normalized)
        1. humidity (normalized)
        2. co2 (normalized)
        3. soil_moisture (normalized)
        4. light_intensity (normalized)
        5. time_of_day_sin (0-24 hour cycle)
        6. time_of_day_cos
        7. day_of_year_sin (seasonal variation)
        8. day_of_year_cos
        9. heating_duty_cycle (0-100)
        10. ventilation_speed (0-100)
        11. misting_duration (minutes)
        """
        X = []
        
        for reading in sensor_history:
            # Normalize continuous variables
            temp_norm = (reading['temperature'] + 40) / 120  # Range [-40, 80]
            humidity_norm = reading['humidity'] / 100  # Range [0, 100]
            co2_norm = reading['co2'] / 5000
            moisture_norm = reading['soil_moisture'] / 100
            light_norm = min(reading['light_intensity'] / 65535, 1.0)
            
            # Time encoding
            hour = reading['timestamp'].hour
            day_of_year = reading['timestamp'].timetuple().tm_yday
            
            time_sin = np.sin(2 * np.pi * hour / 24)
            time_cos = np.cos(2 * np.pi * hour / 24)
            day_sin = np.sin(2 * np.pi * day_of_year / 365)
            day_cos = np.cos(2 * np.pi * day_of_year / 365)
            
            # Actuator states
            heating = reading.get('actuator_heating', 0) / 100
            ventilation = reading.get('actuator_ventilation', 0) / 100
            misting = reading.get('actuator_misting', 0)
            
            features = [
                temp_norm, humidity_norm, co2_norm, moisture_norm, light_norm,
                time_sin, time_cos, day_sin, day_cos,
                heating, ventilation, misting
            ]
            X.append(features)
        
        return np.array(X).reshape(1, 48, 12)  # (batch, seq_len, features)
    
    async def predict(self, site_id: str) -> dict:
        """Generate 24-hour predictions"""
        # Query last 48 readings (5-minute intervals = 4 hours history)
        history = await influxdb.query_last_n_readings(site_id, n=48)
        
        # Prepare features
        X = self.prepare_features(history)
        
        # Predict
        predictions = self.model.predict(X)  # Shape: (1, 3)
        
        # Denormalize predictions
        temp_pred = predictions[0][0] * 120 - 40
        humidity_pred = predictions[0][1] * 100
        moisture_pred = predictions[0][2] * 100
        
        # Calculate confidence (inverse of prediction std)
        confidence = 1.0 - np.std(predictions) / 10
        confidence = max(0.0, min(1.0, confidence))
        
        return {
            "temperature_2h": round(float(temp_pred), 2),
            "humidity_2h": round(float(humidity_pred), 2),
            "soil_moisture_6h": round(float(moisture_pred), 2),
            "confidence": round(float(confidence), 3),
            "generated_at": datetime.utcnow().isoformat()
        }
    
    async def train(self, start_date: date, end_date: date):
        """Retrain model on historical data"""
        # Query historical data
        df = await influxdb.query_historical_data(
            start=start_date, end=end_date, interval='5m'
        )
        
        # Prepare X (input) and y (target)
        X, y = self._prepare_training_data(df)
        
        # Split 70/15/15
        train_size = int(len(X) * 0.7)
        val_size = int(len(X) * 0.15)
        
        X_train, y_train = X[:train_size], y[:train_size]
        X_val, y_val = X[train_size:train_size+val_size], y[train_size:train_size+val_size]
        
        # Train
        history = self.model.fit(
            X_train, y_train,
            validation_data=(X_val, y_val),
            epochs=50,
            batch_size=32,
            callbacks=[
                tf.keras.callbacks.EarlyStopping(patience=5, restore_best_weights=True)
            ]
        )
        
        # Evaluate on test set
        test_loss = self.model.evaluate(X[train_size+val_size:], y[train_size+val_size:])
        
        return {
            "train_loss": float(history.history['loss'][-1]),
            "val_loss": float(history.history['val_loss'][-1]),
            "test_loss": float(test_loss),
            "trained_at": datetime.utcnow().isoformat()
        }

# Scheduled training job
@scheduler.scheduled_job('cron', hour=2, minute=0)
async def daily_lstm_retrain():
    predictor = LSTMPredictor(model_path="models/lstm_v1.h5")
    metrics = await predictor.train(
        start_date=date.today() - timedelta(days=30),
        end_date=date.today()
    )
    
    if metrics['test_loss'] < OLD_MODEL_LOSS:
        predictor.model.save("models/lstm_v1.h5")
        await redis.set("ml_model:lstm:version", 1)
        logger.info(f"LSTM retrained successfully: {metrics}")
    else:
        logger.warning(f"LSTM performance degraded: {metrics}")
        alert = await alert_service.create_alert(
            alert_type="ml_model_degradation",
            details=metrics,
            severity="warning"
        )
```

#### PPO Reinforcement Learning Agent

**Environment Definition:**

```python
import gym
from gym import spaces

class GreenhouseEnv(gym.Env):
    """
    Gymnasium environment for greenhouse control
    
    State: [temp, setpoint_temp, temp_error, humidity, setpoint_humidity,
            humidity_error, co2, soil_moisture, light, hour_sin, hour_cos,
            season_sin]
    
    Action: [heating_duty, ventilation_speed, misting_duration, shade_position]
    """
    
    def __init__(self, site_id: str):
        super().__init__()
        self.site_id = site_id
        
        # Observation space (12 features)
        self.observation_space = spaces.Box(
            low=0, high=1, shape=(12,), dtype=np.float32
        )
        
        # Action space (4 continuous actions, each [0, 1])
        self.action_space = spaces.Box(
            low=0, high=1, shape=(4,), dtype=np.float32
        )
        
        # Setpoints
        self.temp_setpoint = 22.0  # °C
        self.humidity_setpoint = 60  # %
        
        # State buffer
        self.current_state = None
        self.episode_steps = 0
        self.max_episode_steps = 288  # 24 hours (5-min intervals)
    
    def reset(self):
        """Reset environment for new episode"""
        self.episode_steps = 0
        self.current_state = self._get_current_observation()
        return self.current_state
    
    def step(self, action):
        """
        Execute action in environment
        
        Args:
            action: [heating_duty, ventilation_speed, misting_duration, shade]
        
        Returns:
            obs, reward, done, info
        """
        # Map action to actual control values
        heating_duty = int(action[0] * 100)  # 0-100%
        ventilation_speed = int(action[1] * 100)
        misting_duration = int(action[2] * 30)  # 0-30 minutes
        shade_position = int(action[3] * 100)  # 0-100%
        
        # Publish to MQTT
        await self._publish_control_action({
            "heating": heating_duty,
            "ventilation": ventilation_speed,
            "misting": misting_duration,
            "shade": shade_position
        })
        
        # Simulate next state (5 minutes forward)
        await asyncio.sleep(1)  # Simulate delay
        next_state = self._get_current_observation()
        
        # Calculate reward
        reward = self._compute_reward(next_state, action)
        
        # Check episode termination
        self.episode_steps += 1
        done = self.episode_steps >= self.max_episode_steps
        
        info = {
            "temperature": next_state[0] * 40 - 20,  # Denormalize
            "humidity": next_state[3] * 100,
            "energy_consumed": action[0] + action[1],  # Sum of duty cycles
        }
        
        self.current_state = next_state
        return next_state, reward, done, info
    
    def _get_current_observation(self) -> np.ndarray:
        """Fetch current sensor readings and normalize"""
        latest = await sensor_service.get_latest_readings(self.site_id)
        
        # Normalize to [0, 1]
        temp_norm = (latest['temperature'] + 20) / 40  # Range [-20, 20] → [0, 1]
        humidity_norm = latest['humidity'] / 100
        co2_norm = latest['co2'] / 5000
        soil_moisture_norm = latest['soil_moisture'] / 100
        light_norm = min(latest['light'] / 65535, 1.0)
        
        # Errors
        temp_error = abs(latest['temperature'] - self.temp_setpoint) / 10
        humidity_error = abs(latest['humidity'] - self.humidity_setpoint) / 30
        
        # Time encoding
        now = datetime.now()
        hour_sin = np.sin(2 * np.pi * now.hour / 24)
        hour_cos = np.cos(2 * np.pi * now.hour / 24)
        day_sin = np.sin(2 * np.pi * now.timetuple().tm_yday / 365)
        
        obs = np.array([
            temp_norm, self.temp_setpoint / 40, temp_error,
            humidity_norm, self.humidity_setpoint / 100, humidity_error,
            co2_norm, soil_moisture_norm, light_norm,
            hour_sin, hour_cos, day_sin
        ], dtype=np.float32)
        
        return obs
    
    def _compute_reward(self, state: np.ndarray, action: np.ndarray) -> float:
        """
        Reward function balances multiple objectives:
        1. Maintain temperature within ±1°C of setpoint
        2. Maintain humidity within ±5% of setpoint
        3. Minimize energy consumption
        4. Avoid anomalies (extreme values)
        """
        temp_denorm = state[0] * 40 - 20
        humidity_denorm = state[3] * 100
        
        # Temperature error component
        temp_error = abs(temp_denorm - self.temp_setpoint)
        temp_penalty = max(0, (temp_error - 1) / 10)  # Slack of ±1°C
        
        # Humidity error component
        humidity_error = abs(humidity_denorm - self.humidity_setpoint)
        humidity_penalty = max(0, (humidity_error - 5) / 30)  # Slack of ±5%
        
        # Energy consumption component
        energy_used = action[0] + action[1]  # heating + ventilation
        energy_penalty = energy_used * 0.01
        
        # Water usage component
        water_penalty = action[2] * 0.001
        
        # Anomaly penalty
        is_anomalous = (temp_denorm < -10 or temp_denorm > 35 or 
                       humidity_denorm < 20 or humidity_denorm > 95)
        anomaly_penalty = 20 if is_anomalous else 0
        
        reward = (
            10 * (1 - temp_penalty) +           # ±1°C maintained
            5 * (1 - humidity_penalty) +        # ±5% maintained
            -energy_penalty +                   # Penalize energy
            -water_penalty +                    # Penalize water
            -anomaly_penalty                    # Penalize anomalies
        )
        
        return reward

# Training Loop
from stable_baselines3 import PPO

def train_ppo_agent(site_id: str, timesteps: int = 100000):
    env = GreenhouseEnv(site_id)
    
    model = PPO(
        "MlpPolicy",
        env,
        learning_rate=3e-4,
        n_steps=2048,
        batch_size=64,
        n_epochs=10,
        clip_range=0.2,
        verbose=1,
        tensorboard_log="logs/ppo"
    )
    
    model.learn(total_timesteps=timesteps)
    model.save(f"models/ppo_{site_id}")
    
    return model

# Inference
async def get_rl_control_action(site_id: str):
    model = PPO.load(f"models/ppo_{site_id}")
    env = GreenhouseEnv(site_id)
    
    obs, _ = env.reset()
    action, _ = model.predict(obs, deterministic=True)
    
    return {
        "heating_duty": int(action[0] * 100),
        "ventilation_speed": int(action[1] * 100),
        "misting_duration": int(action[2] * 30),
        "shade_position": int(action[3] * 100),
        "triggered_by": "rl_policy",
        "policy_version": "ppo_v1"
    }

# Daily retraining
@scheduler.scheduled_job('cron', hour=3, minute=0)
async def daily_ppo_retrain():
    for site_id in get_active_sites():
        try:
            model = train_ppo_agent(site_id, timesteps=50000)
            
            # Evaluate new policy
            new_score = evaluate_policy(model, episodes=10)
            old_score = await redis.get(f"ppo:{site_id}:baseline_score")
            
            if new_score > float(old_score or 0):
                await redis.set(f"ppo:{site_id}:baseline_score", new_score)
                logger.info(f"PPO {site_id} updated: score={new_score}")
            else:
                logger.warning(f"PPO {site_id} degraded: {new_score} < {old_score}")
        except Exception as e:
            logger.error(f"PPO training failed for {site_id}: {e}")
```

#### Isolation Forest Anomaly Detector

```python
from sklearn.ensemble import IsolationForest
import joblib

class AnomalyDetector:
    def __init__(self, model_path: str = None):
        self.model = IsolationForest(
            contamination=0.05,  # Expect 5% anomalies
            n_estimators=100,
            random_state=42,
            n_jobs=-1  # Parallel processing
        )
        if model_path:
            self.model = joblib.load(model_path)
    
    async def detect(self, reading: dict) -> dict:
        """
        Real-time anomaly detection
        
        Features:
        0. temperature (current)
        1. temperature (rate of change per minute)
        2. humidity (current)
        3. humidity (rate of change per minute)
        4. co2 (current)
        5. soil_moisture
        6. light_intensity
        7. correlation(temperature, humidity)  # Should be inverse
        8. hours_since_last_sensor_update
        9. sensor_readings_per_minute (frequency check)
        """
        
        # Build feature vector
        features = await self._build_feature_vector(reading)
        features = np.array(features).reshape(1, -1)
        
        # Inference
        anomaly_prediction = self.model.predict(features)[0]  # -1 or 1
        anomaly_score = self.model.score_samples(features)[0]  # Lower is more anomalous
        
        is_anomaly = anomaly_prediction == -1
        
        if is_anomaly:
            # Classify anomaly type
            anomaly_type = await self._classify_anomaly_type(reading, anomaly_score)
        else:
            anomaly_type = None
        
        return {
            "is_anomaly": bool(is_anomaly),
            "score": float(anomaly_score),
            "severity": self._score_to_severity(anomaly_score),
            "anomaly_type": anomaly_type
        }
    
    async def _build_feature_vector(self, reading: dict) -> list:
        """Construct 10-dimensional feature vector"""
        
        # Get previous reading for rate of change
        prev = await sensor_service.get_previous_reading(reading['sensor_id'])
        
        # Temperature rate of change
        if prev:
            time_delta = (reading['timestamp'] - prev['timestamp']).total_seconds() / 60
            temp_rate = (reading['temperature'] - prev['temperature']) / max(time_delta, 1)
            humidity_rate = (reading['humidity'] - prev['humidity']) / max(time_delta, 1)
        else:
            temp_rate = 0
            humidity_rate = 0
        
        # Correlation with historical data
        history = await sensor_service.get_last_n_readings(reading['sensor_id'], n=20)
        temps = [r['temperature'] for r in history]
        humidities = [r['humidity'] for r in history]
        correlation = np.corrcoef(temps, humidities)[0, 1] if len(temps) > 2 else -0.5
        
        # Sensor uptime
        hours_since_update = 0  # Assume current
        readings_per_minute = len(history) / 100  # 100 minutes of data
        
        features = [
            reading['temperature'],
            temp_rate,
            reading['humidity'],
            humidity_rate,
            reading.get('co2', 0) / 5000,
            reading.get('soil_moisture', 0) / 100,
            reading.get('light_intensity', 0) / 65535,
            correlation,
            hours_since_update,
            readings_per_minute
        ]
        
        return features
    
    async def _classify_anomaly_type(self, reading: dict, score: float) -> str:
        """Classify what type of anomaly was detected"""
        
        if reading['temperature'] > 35 or reading['temperature'] < -10:
            return "extreme_temperature"
        elif reading['humidity'] > 95 or reading['humidity'] < 10:
            return "extreme_humidity"
        elif reading.get('co2', 0) < 300:  # Too low
            return "ventilation_failure"
        elif reading['soil_moisture'] < 20:
            return "irrigation_failure"
        elif score < -1.0:
            return "multivariate_anomaly"
        else:
            return "unknown"
    
    def _score_to_severity(self, score: float) -> str:
        """Convert anomaly score to severity level"""
        if score < -0.8:
            return "critical"
        elif score < -0.5:
            return "warning"
        else:
            return "info"
    
    async def train(self, start_date: date, end_date: date):
        """Retrain on historical data"""
        
        # Query historical readings
        df = await influxdb.query_historical_data(
            start=start_date, end=end_date, interval='5m'
        )
        
        # Prepare feature matrix
        X = []
        for _, row in df.iterrows():
            features = await self._build_feature_vector(row.to_dict())
            X.append(features)
        
        X = np.array(X)
        
        # Train
        self.model.fit(X)
        
        # Save
        joblib.dump(self.model, "models/isolation_forest.pkl")
        
        return {"samples_used": len(X), "trained_at": datetime.utcnow().isoformat()}

# Scheduled detection
@scheduler.scheduled_job('interval', minutes=1)
async def check_anomalies():
    detector = AnomalyDetector(model_path="models/isolation_forest.pkl")
    
    for site_id in get_active_sites():
        latest = await sensor_service.get_latest_reading(site_id)
        result = await detector.detect(latest)
        
        if result['is_anomaly']:
            alert = await alert_service.create_alert(
                site_id=site_id,
                alert_type=f"anomaly_{result['anomaly_type']}",
                severity=result['severity'],
                details=result
            )
            await alert_service.dispatch(alert)
```

---

### 1.4 Actuator Control Design

**Actuator Abstraction Layer:**

```python
class ActuatorController:
    """
    Abstract interface for controlling greenhouse actuators
    Implementations vary: relay, PWM, servo, etc.
    """
    
    async def set_heating(self, duty_cycle: int):
        """
        Set heating duty cycle (0-100%)
        
        duty_cycle: Percentage of time heater is ON
        Example: 75% = heater ON for 45s, OFF for 15s (60s cycle)
        """
        if not 0 <= duty_cycle <= 100:
            raise ValueError("duty_cycle must be 0-100")
        
        await self._publish_command(
            topic="greenhouse/actuators/heating/command",
            payload={"duty_cycle": duty_cycle, "timestamp": datetime.utcnow().isoformat()}
        )
    
    async def set_ventilation(self, speed: int):
        """
        Set ventilation fan speed (0-100%)
        
        speed: Fan speed percentage
        0% = OFF, 50% = half speed, 100% = full speed
        """
        if not 0 <= speed <= 100:
            raise ValueError("speed must be 0-100")
        
        # Control via PWM (Pulse Width Modulation)
        await self._publish_command(
            topic="greenhouse/actuators/ventilation/command",
            payload={"fan_speed": speed, "timestamp": datetime.utcnow().isoformat()}
        )
    
    async def set_misting(self, duration_sec: int, interval_min: int = None):
        """
        Activate misting system
        
        duration_sec: How long to keep misting ON
        interval_min: If set, misting repeats every N minutes
        """
        if duration_sec < 0 or (interval_min and interval_min < 1):
            raise ValueError("Invalid misting parameters")
        
        await self._publish_command(
            topic="greenhouse/actuators/misting/command",
            payload={
                "duration_sec": duration_sec,
                "interval_min": interval_min,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
    
    async def set_shade(self, position: int):
        """
        Set shade position (0-100%)
        
        position: 0% = fully open, 100% = fully closed
        """
        if not 0 <= position <= 100:
            raise ValueError("position must be 0-100")
        
        await self._publish_command(
            topic="greenhouse/actuators/shade/command",
            payload={"position": position}
        )
    
    async def _publish_command(self, topic: str, payload: dict):
        """Publish MQTT command"""
        
        # Add audit trail
        await postgres.insert("actuator_commands", {
            "site_id": extract_site_id(topic),
            "actuator_type": topic.split('/')[2],
            "command": json.dumps(payload),
            "issued_by": current_user.id,
            "timestamp": datetime.utcnow(),
            "status": "pending"
        })
        
        # Publish to MQTT (retain message for offline devices)
        await mqtt_client.publish(
            topic=topic,
            payload=json.dumps(payload),
            qos=2,
            retain=False
        )
    
    async def get_actuator_status(self, actuator_id: str) -> dict:
        """Get current status of an actuator"""
        
        # Query MQTT status topic
        status_topic = f"greenhouse/actuators/{actuator_id}/status"
        status = await mqtt_client.get_retained_message(status_topic)
        
        return status or {
            "actuator_id": actuator_id,
            "status": "unknown",
            "last_update": None
        }

# REST API Endpoint
@router.post("/control/actuators")
async def control_actuator(
    command: ActuatorCommand,
    current_user: User = Depends(get_current_user)
):
    """
    Manual actuator control endpoint
    
    Requires: operator or admin role
    """
    
    if current_user.role not in ["operator", "admin"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    controller = ActuatorController()
    
    try:
        if command.actuator_type == "heating":
            await controller.set_heating(command.value)
        elif command.actuator_type == "ventilation":
            await controller.set_ventilation(command.value)
        elif command.actuator_type == "misting":
            await controller.set_misting(
                duration_sec=command.duration,
                interval_min=command.interval
            )
        elif command.actuator_type == "shade":
            await controller.set_shade(command.value)
        else:
            raise ValueError(f"Unknown actuator: {command.actuator_type}")
        
        return {
            "status": "success",
            "actuator": command.actuator_type,
            "command_issued_at": datetime.utcnow().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Actuator control failed: {e}")
        raise HTTPException(status_code=500, detail="Command execution failed")
```

---

### 1.5 Alert & Notification System Design

**Alert Rule Engine:**

```python
class AlertRuleEngine:
    
    async def check_all_rules(self, site_id: str):
        """Evaluate all active rules for a site"""
        
        rules = await postgres.query(
            "SELECT * FROM alert_rules WHERE site_id=? AND is_active=true",
            [site_id]
        )
        
        current_readings = await sensor_service.get_latest_readings(site_id)
        
        triggered_alerts = []
        
        for rule in rules:
            # Evaluate condition
            is_triggered = await self._evaluate_condition(
                rule['condition'],
                current_readings
            )
            
            if is_triggered:
                # Check if already in cooldown period
                if await self._is_in_cooldown(rule['id']):
                    continue
                
                alert = {
                    "rule_id": rule['id'],
                    "site_id": site_id,
                    "alert_type": rule['alert_type'],
                    "severity": rule['severity'],
                    "message": rule['message'],
                    "readings": current_readings,
                    "triggered_at": datetime.utcnow(),
                    "acknowledged": False,
                    "dismissed": False
                }
                
                # Store in database
                alert_id = await postgres.insert("alerts", alert)
                
                # Dispatch notifications
                if rule['severity'] == 'critical':
                    await self._dispatch_critical_alert(alert)
                elif rule['severity'] == 'warning':
                    await self._dispatch_warning_alert(alert)
                else:
                    await self._dispatch_info_alert(alert)
                
                # Set cooldown
                await redis.setex(
                    f"alert:{rule['id']}:cooldown",
                    rule['cooldown_sec'],
                    "1"
                )
                
                triggered_alerts.append(alert)
        
        return triggered_alerts
    
    async def _evaluate_condition(self, condition: str, readings: dict) -> bool:
        """
        Evaluate alert condition string
        
        Examples:
        - "temperature > 30"
        - "humidity < 40"
        - "temperature > 30 for 5 minutes"
        - "temperature > 30 AND humidity > 80"
        """
        
        # Parse condition
        if " for " in condition:
            condition_part, duration_part = condition.rsplit(" for ", 1)
            duration_min = int(duration_part.split()[0])
            
            # Check if condition was true for N minutes
            history = await sensor_service.get_readings_last_n_minutes(
                reading['sensor_id'], n=duration_min
            )
            
            condition_true_count = sum(
                1 for reading in history
                if await self._eval_simple_condition(condition_part, reading)
            )
            
            return condition_true_count >= len(history) * 0.9  # 90% of time
        else:
            return await self._eval_simple_condition(condition, readings)
    
    async def _eval_simple_condition(self, condition: str, readings: dict) -> bool:
        """Evaluate simple comparison"""
        
        # Parse: "temperature > 30"
        if " > " in condition:
            field, value = condition.split(" > ")
            return float(readings[field.strip()]) > float(value)
        elif " < " in condition:
            field, value = condition.split(" < ")
            return float(readings[field.strip()]) < float(value)
        elif " == " in condition:
            field, value = condition.split(" == ")
            return float(readings[field.strip()]) == float(value)
        else:
            return False

class NotificationDispatcher:
    
    async def send_critical_alert(self, alert: dict, users: list):
        """Send multiple notification channels"""
        
        tasks = []
        for user in users:
            # SMS
            tasks.append(self._send_sms(user.phone, alert))
            
            # Email
            tasks.append(self._send_email(user.email, alert))
            
            # Push notification
            tasks.append(self._send_push_notification(user.id, alert))
            
            # In-app notification
            tasks.append(self._send_in_app_notification(user.id, alert))
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        return {
            "alert_id": alert['id'],
            "notifications_sent": len([r for r in results if r]),
            "failures": len([r for r in results if isinstance(r, Exception)])
        }
    
    async def _send_sms(self, phone: str, alert: dict) -> bool:
        """Send SMS via Twilio"""
        try:
            message = f"🚨 {alert['alert_type'].upper()}: {alert['message']}"
            
            client = TwilioClient(account_sid, auth_token)
            client.messages.create(
                body=message,
                from_=TWILIO_PHONE,
                to=phone
            )
            
            logger.info(f"SMS sent to {phone}")
            return True
        except Exception as e:
            logger.error(f"SMS failed: {e}")
            return False
    
    async def _send_email(self, email: str, alert: dict) -> bool:
        """Send email via SendGrid"""
        try:
            html_content = f"""
            <h2>{alert['alert_type'].upper()}</h2>
            <p><strong>Severity:</strong> {alert['severity']}</p>
            <p><strong>Message:</strong> {alert['message']}</p>
            <p><strong>Current Readings:</strong></p>
            <ul>
                <li>Temperature: {alert['readings']['temperature']}°C</li>
                <li>Humidity: {alert['readings']['humidity']}%</li>
                <li>CO₂: {alert['readings']['co2']} ppm</li>
            </ul>
            <a href="https://greenhouse.app/alerts/{alert['id']}">View Details</a>
            """
            
            sg = SendGridAPIClient(SENDGRID_API_KEY)
            email_msg = Mail(
                from_email="alerts@greenhouse.io",
                to_emails=email,
                subject=f"Alert: {alert['alert_type']}",
                html_content=html_content
            )
            
            sg.send(email_msg)
            logger.info(f"Email sent to {email}")
            return True
        except Exception as e:
            logger.error(f"Email failed: {e}")
            return False
    
    async def _send_push_notification(self, user_id: str, alert: dict) -> bool:
        """Send push notification via Firebase"""
        try:
            fcm_tokens = await postgres.query(
                "SELECT fcm_token FROM user_devices WHERE user_id=?",
                [user_id]
            )
            
            for token in fcm_tokens:
                message = messaging.Message(
                    notification=messaging.Notification(
                        title=alert['alert_type'].upper(),
                        body=alert['message']
                    ),
                    data={
                        "alert_id": str(alert['id']),
                        "severity": alert['severity'],
                        "timestamp": alert['triggered_at'].isoformat()
                    },
                    token=token['fcm_token']
                )
                
                messaging.send(message)
            
            logger.info(f"Push notification sent to {user_id}")
            return True
        except Exception as e:
            logger.error(f"Push notification failed: {e}")
            return False
    
    async def _send_in_app_notification(self, user_id: str, alert: dict) -> bool:
        """Broadcast to connected WebSocket clients"""
        try:
            await ws_manager.broadcast(
                site_id=alert['site_id'],
                message={
                    "type": "alert",
                    "alert_id": str(alert['id']),
                    "alert_type": alert['alert_type'],
                    "severity": alert['severity'],
                    "message": alert['message'],
                    "timestamp": alert['triggered_at'].isoformat()
                }
            )
            return True
        except Exception as e:
            logger.error(f"In-app notification failed: {e}")
            return False
```

---

## 2. User Interface Design

### 2.1 Dashboard Layout

**Main Dashboard (Desktop):**
```
┌─────────────────────────────────────────────────────────────┐
│  Greenhouse Controller Dashboard                    [📊] [⚙️] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Site: [Greenhouse 01 ▼]                   Last Update: 2s  │
│                                                             │
│  ┌──────────┬──────────┬──────────┬──────────┐              │
│  │ TEMP     │ HUMIDITY │ CO₂      │ SOIL     │              │
│  │ 25.3°C   │ 62 %     │ 520 ppm  │ 48 %     │              │
│  │ Setpoint │ Setpoint │ Optimal  │ Optimal  │              │
│  │ 22°C ↓   │ 60% ↑    │   ●      │   ●      │              │
│  └──────────┴──────────┴──────────┴──────────┘              │
│                                                             │
│  ALERTS                                 24H TREND           │
│  ┌────────────────────┐  ┌─────────────────────────────┐   │
│  │ 🔴 CRITICAL (1 min)│  │ Temperature              27°C│   │
│  │ Temp > 30°C        │  │ ┌─────────────────────────┐ │   │
│  │ □ Acknowledge      │  │ │╱╲      ╱╲    ╱╲    ╱╲  │ │   │
│  │                    │  │╱  ╲    ╱  ╲  ╱  ╲  ╱  │ │   │
│  │ 🟡 WARNING (15 min)│  │      ╲╱    ╲╱    ╲╱    │ │   │
│  │ Humidity > 80%     │  │ 24h     18h     12h    6h│ │   │
│  │ □ Acknowledge      │  │└─────────────────────────┘ │   │
│  │                    │  │ Humidity                62%│   │
│  │ 🟢 INFO (1h)       │  │ CO₂                 520ppm│   │
│  │ Misting activat... │  │ Soil Moisture           48%│   │
│  └────────────────────┘  └─────────────────────────────┘   │
│                                                             │
│  QUICK ACTIONS                      PREDICTIONS (ML)        │
│  ┌──────────────┐              ┌─────────────────────────┐ │
│  │ ◎ Heating    │              │ Next 2 Hours:          │ │
│  │ [===========] 75%           │ Temperature:  26.5°C    │ │
│  │                             │ Confidence:   87%       │ │
│  │ ◎ Ventilation│              │                         │ │
│  │ [======    ] 60%            │ Recommended Actions:    │ │
│  │                             │ • Reduce heating to 30% │ │
│  │ 💧 Misting                  │ • Increase ventilation  │ │
│  │ [Duration: __ min]          │                         │ │
│  │ [Interval: 15 min]          │ ▶ Apply Recommendation  │ │
│  │                             └─────────────────────────┘ │
│  │ ☀️ Shade: [====       ] 40%                             │
│  └──────────────┘                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Mobile Dashboard:**
```
┌─────────────────────┐
│ ☰ Greenhouse       │ (compact header)
├─────────────────────┤
│                     │
│ TEMP    HUMIDITY    │
│ 25.3°C  62%        │
│ ▼ 22°C  ▲ 60%      │
│                     │
│ CO₂       SOIL      │
│ 520ppm   48%       │
│                     │
├─────────────────────┤
│ 🔴 CRITICAL ALERT   │ (full-width)
│ Temperature > 30°C  │
│ [Acknowledge]       │
├─────────────────────┤
│ 24h TREND          │ (collapsible chart)
│                     │
├─────────────────────┤
│ QUICK ACTIONS       │ (vertical stack)
│ [Heating    ▬▬▬]    │
│ [Ventilation▬▬▬]    │
│ [Misting]           │
│ [Shade      ▬▬▬]    │
└─────────────────────┘
```

### 2.2 Component Design Details

**Temperature Gauge Component:**
```jsx
// SensorGauge.jsx
import React from 'react';
import { Gauge, GaugeContainer, GaugeValueArc, Reference } from '@mui/x-charts';

export const SensorGauge = ({ 
    label = "Temperature",
    value = 24.5,
    unit = "°C",
    min = 0,
    max = 50,
    setpoint = 22,
    color = "primary"
}) => {
    // Color based on deviation from setpoint
    const deviation = Math.abs(value - setpoint);
    let statusColor = "green";
    if (deviation > 2) statusColor = "orange";
    if (deviation > 5) statusColor = "red";
    
    return (
        <div className="gauge-container">
            <GaugeContainer width={150} height={150} value={value} minValue={min} maxValue={max}>
                <GaugeValueArc valueMin={min} valueMax={max} />
                <Reference y={setpoint} label={`Target: ${setpoint}${unit}`} />
            </GaugeContainer>
            
            <div className="gauge-info">
                <h3>{label}</h3>
                <p style={{ color: statusColor, fontSize: "24px" }}>
                    {value.toFixed(1)}{unit}
                </p>
                <p className="setpoint">Setpoint: {setpoint}{unit}</p>
            </div>
        </div>
    );
};
```

**Alert Panel Component:**
```jsx
// AlertPanel.jsx
import React, { useState } from 'react';

export const AlertPanel = ({ alerts = [] }) => {
    const [snoozedAlerts, setSnoozed] = useState({});
    
    const handleAcknowledge = async (alertId) => {
        await api.post(`/alerts/${alertId}/acknowledge`);
        // Remove from display
    };
    
    const handleSnooze = async (alertId, minutes) => {
        setSnoozed({...snoozedAlerts, [alertId]: minutes});
        await api.post(`/alerts/${alertId}/snooze`, {minutes});
    };
    
    const sortedAlerts = alerts
        .sort((a, b) => {
            const severityOrder = { critical: 0, warning: 1, info: 2 };
            return severityOrder[a.severity] - severityOrder[b.severity];
        });
    
    return (
        <div className="alert-panel">
            <h3>Alerts</h3>
            
            {sortedAlerts.length === 0 && (
                <p className="no-alerts">All systems nominal</p>
            )}
            
            {sortedAlerts.map(alert => (
                <div 
                    key={alert.id}
                    className={`alert-item alert-${alert.severity}`}
                >
                    <div className="alert-header">
                        <span className={`badge badge-${alert.severity}`}>
                            {alert.severity.toUpperCase()}
                        </span>
                        <span className="alert-type">{alert.alert_type}</span>
                        <span className="alert-time">{formatTime(alert.triggered_at)}</span>
                    </div>
                    
                    <p className="alert-message">{alert.message}</p>
                    
                    <div className="alert-actions">
                        <button onClick={() => handleAcknowledge(alert.id)}>
                            Acknowledge
                        </button>
                        <select onChange={(e) => handleSnooze(alert.id, parseInt(e.target.value))}>
                            <option value="">Snooze</option>
                            <option value={1}>1 minute</option>
                            <option value={30}>30 minutes</option>
                            <option value={60}>1 hour</option>
                            <option value={480}>8 hours</option>
                        </select>
                    </div>
                </div>
            ))}
        </div>
    );
};
```

---

## 3. API Response Format Standards

**Successful Response:**
```json
{
  "status": "success",
  "data": {
    "sensor_id": "temp_01",
    "value": 24.5,
    "unit": "°C"
  },
  "timestamp": "2026-06-15T14:30:00Z",
  "request_id": "uuid-1234"
}
```

**Error Response:**
```json
{
  "status": "error",
  "error": {
    "code": "INVALID_SENSOR_ID",
    "message": "Sensor not found",
    "details": {
      "sensor_id": "unknown_sensor"
    }
  },
  "timestamp": "2026-06-15T14:30:00Z",
  "request_id": "uuid-1234"
}
```

---

## 4. Database Schema (Detailed)

### PostgreSQL Tables (Core)

**Users & Permissions:**
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(20),
    role VARCHAR(50),  -- admin, operator, viewer, researcher
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

CREATE TABLE sites (
    id UUID PRIMARY KEY,
    owner_id UUID REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    location VARCHAR(500),
    area_sqm DECIMAL(10, 2),
    timezone VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE site_members (
    site_id UUID REFERENCES sites(id),
    user_id UUID REFERENCES users(id),
    role VARCHAR(50),  -- site_admin, operator, viewer
    added_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (site_id, user_id)
);
```

**Sensors & Configuration:**
```sql
CREATE TABLE sensors (
    id UUID PRIMARY KEY,
    site_id UUID REFERENCES sites(id) NOT NULL,
    sensor_type VARCHAR(50) NOT NULL,  -- temperature, humidity, soil_moisture, co2, light
    location VARCHAR(255),  -- e.g., "Zone A", "North Wall"
    mqtt_topic VARCHAR(255) UNIQUE,
    unit VARCHAR(20),
    min_value DECIMAL(10, 4),
    max_value DECIMAL(10, 4),
    accuracy DECIMAL(10, 4),
    calibration_date TIMESTAMP,
    last_reading_at TIMESTAMP,
    last_reading_value DECIMAL(10, 4),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_site_type (site_id, sensor_type)
);
```

**Actuators:**
```sql
CREATE TABLE actuators (
    id UUID PRIMARY KEY,
    site_id UUID REFERENCES sites(id) NOT NULL,
    actuator_type VARCHAR(50) NOT NULL,  -- heating, ventilation, misting, shade
    location VARCHAR(255),
    mqtt_control_topic VARCHAR(255),
    mqtt_status_topic VARCHAR(255),
    min_value DECIMAL(10, 4),
    max_value DECIMAL(10, 4),
    last_command_at TIMESTAMP,
    last_command_value DECIMAL(10, 4),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Alert Rules:**
```sql
CREATE TABLE alert_rules (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) NOT NULL,
    site_id UUID REFERENCES sites(id) NOT NULL,
    alert_type VARCHAR(100),
    condition TEXT,  -- "temperature > 30" or JSON for complex rules
    severity VARCHAR(20),  -- critical, warning, info
    notification_channels TEXT[],  -- ['email', 'sms', 'push']
    auto_mitigation BOOLEAN DEFAULT false,
    cooldown_sec INT DEFAULT 300,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Alerts (History):**
```sql
CREATE TABLE alerts (
    id UUID PRIMARY KEY,
    site_id UUID REFERENCES sites(id) NOT NULL,
    rule_id UUID REFERENCES alert_rules(id),
    alert_type VARCHAR(100),
    severity VARCHAR(20),
    message TEXT,
    sensor_readings JSONB,
    triggered_at TIMESTAMP DEFAULT NOW(),
    acknowledged_at TIMESTAMP,
    acknowledged_by UUID REFERENCES users(id),
    dismissed BOOLEAN DEFAULT false,
    INDEX idx_site_time (site_id, triggered_at),
    INDEX idx_severity (severity)
);
```

**Actuator Commands (Audit Trail):**
```sql
CREATE TABLE actuator_commands (
    id UUID PRIMARY KEY,
    site_id UUID REFERENCES sites(id),
    actuator_id UUID REFERENCES actuators(id),
    command JSONB,  -- {"duty_cycle": 75, "triggered_by": "manual"}
    issued_by UUID REFERENCES users(id),
    issued_at TIMESTAMP DEFAULT NOW(),
    status VARCHAR(50),  -- pending, executed, failed
    response JSONB,
    executed_at TIMESTAMP,
    INDEX idx_site_time (site_id, issued_at)
);
```

**ML Models (Versioning):**
```sql
CREATE TABLE ml_models (
    id UUID PRIMARY KEY,
    site_id UUID REFERENCES sites(id),
    model_type VARCHAR(50),  -- lstm, ppo, isolation_forest
    version INT,
    model_path VARCHAR(500),  -- S3 or Railway artifacts
    training_start_date DATE,
    training_end_date DATE,
    metrics JSONB,  -- {train_loss, val_loss, test_loss, accuracy, etc}
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    deployed_at TIMESTAMP,
    UNIQUE (site_id, model_type, version)
);
```

### InfluxDB Buckets (Time-Series)

**sensor_reading Measurement:**
```
Tags: site_id, sensor_type, location, sensor_id
Fields: value (float), unit (string)
```

**actuator_command Measurement:**
```
Tags: site_id, actuator_type, triggered_by (manual|rule|ml_policy)
Fields: command_value (float), energy_used (float)
```

**system_metrics Measurement:**
```
Tags: component (api|mqtt|database)
Fields: cpu_percent (float), memory_percent (float), uptime_seconds (int)
```

---

## 5. Error Handling & Fallback Strategies

**Network Failure Handling:**
```python
class MQTTClientWithFailover:
    async def publish_with_retry(self, topic: str, payload: dict, max_retries=3):
        """Publish with exponential backoff"""
        
        for attempt in range(max_retries):
            try:
                result = await self.client.publish(topic, payload, qos=2)
                return result
            except ConnectionError:
                if attempt < max_retries - 1:
                    wait_time = 2 ** attempt  # 1s, 2s, 4s
                    logger.warning(f"MQTT publish failed, retrying in {wait_time}s")
                    await asyncio.sleep(wait_time)
                else:
                    # Queue message for later delivery
                    await self._queue_offline_message(topic, payload)
                    logger.error(f"MQTT publish failed after {max_retries} attempts, queued for later")
                    return None

class OfflineQueue:
    """Persist messages when broker is unavailable"""
    
    async def _queue_offline_message(self, topic: str, payload: dict):
        await postgres.insert("offline_messages", {
            "topic": topic,
            "payload": json.dumps(payload),
            "created_at": datetime.utcnow(),
            "delivered": False
        })
    
    async def process_queue(self):
        """Process queued messages when connection is restored"""
        messages = await postgres.query(
            "SELECT * FROM offline_messages WHERE delivered=false LIMIT 100"
        )
        
        for msg in messages:
            try:
                result = await self.client.publish(msg['topic'], msg['payload'], qos=2)
                await postgres.update(
                    "offline_messages",
                    {"delivered": True},
                    {"id": msg['id']}
                )
            except Exception as e:
                logger.error(f"Failed to deliver queued message: {e}")
```

---

## 6. Performance Optimization Techniques

**Query Optimization:**
```python
# Use database indexes
CREATE INDEX idx_readings_timestamp ON sensor_reading(timestamp DESC);
CREATE INDEX idx_alerts_severity_time ON alerts(severity, triggered_at DESC);

# Use materialized views for aggregations
CREATE MATERIALIZED VIEW hourly_sensor_stats AS
SELECT 
    site_id,
    sensor_type,
    date_trunc('hour', timestamp) as hour,
    AVG(value) as avg_value,
    MIN(value) as min_value,
    MAX(value) as max_value
FROM sensor_reading
GROUP BY site_id, sensor_type, date_trunc('hour', timestamp);

REFRESH MATERIALIZED VIEW hourly_sensor_stats;
```

**Frontend Optimization:**
```javascript
// Code splitting with React.lazy
const Analytics = React.lazy(() => import('./Analytics'));
const Reports = React.lazy(() => import('./Reports'));

// Image optimization
<img src="gauge.webp" alt="Temperature" loading="lazy" />

// Virtual scrolling for large alert lists
import { FixedSizeList } from 'react-window';
```

---

**Document Version:** 1.0  
**Last Updated:** June 2026  
**Owner:** Lazy (B.E. CSE AI&ML, PES Mandya)
