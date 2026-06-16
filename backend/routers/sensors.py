from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, database
from ..services import anomaly

router = APIRouter(
    prefix="/sensors",
    tags=["sensors"],
)

@router.post("/data", response_model=models.SensorDataResponse)
def ingest_sensor_data(data: models.SensorDataCreate, db: Session = Depends(database.get_db)):
    db_data = models.SensorDataDB(**data.model_dump())
    db.add(db_data)
    db.commit()
    db.refresh(db_data)
    
    # Run anomaly detection
    anomaly.check_for_anomalies(db, data)
    
    # Run automated actuator feedback loop
    from .crops import ACTIVE_CROP
    crop = db.query(models.CropProfileDB).filter(models.CropProfileDB.name == ACTIVE_CROP).first()
    import json
    if crop:
        ranges = json.loads(crop.ranges_json)
    else:
        ranges = {
            "temperature": {"min": 22, "max": 27},
            "humidity": {"min": 60, "max": 80},
            "light": {"min": 500, "max": 1200},
            "co2": {"min": 400, "max": 800},
            "nutrition": {"min": 12, "max": 18}
        }
    sensor_type = data.sensor_type
    value = data.value
    
    trigger = False
    action = "none"
    cause = ""
    
    # Check thresholds and map to actions
    if sensor_type == "temperature":
        temp_range = ranges.get("temperature", {"min": 20, "max": 28})
        if value > temp_range["max"]:
            trigger = True
            action = "fan_on"
            cause = f"Automated: Temp {value:.1f}°C > max {temp_range['max']}°C"
        elif value < temp_range["min"]:
            trigger = True
            action = "vent_open"
            cause = f"Automated: Temp {value:.1f}°C < min {temp_range['min']}°C"
            
    elif sensor_type == "humidity":
        hum_range = ranges.get("humidity", {"min": 60, "max": 85})
        if value > hum_range["max"]:
            trigger = True
            action = "vent_open"
            cause = f"Automated: Humidity {value:.1f}% > max {hum_range['max']}%"
            
    elif sensor_type == "light":
        light_range = ranges.get("light", {"min": 300, "max": 1000})
        if value < light_range["min"]:
            trigger = True
            action = "light_on"
            cause = f"Automated: Light {value:.1f} lx < min {light_range['min']} lx"
            
    elif sensor_type == "soil_moisture" or sensor_type == "nutrition":
        nut_range = ranges.get("nutrition", {"min": 10, "max": 20})
        if value < nut_range["min"]:
            trigger = True
            action = "irrigate"
            cause = f"Automated: Moisture {value:.1f}% < min {nut_range['min']}%"
            
    if trigger:
        from ..services.logging import record_actuator_log
        power_map = {
            "fan_on": 50.0,
            "vent_open": 20.0,
            "light_on": 30.0,
            "irrigate": 40.0,
        }
        power = power_map.get(action, 10.0)
        
        # Prevent duplicate logs for the same sensor/action within the last 1 minute
        from datetime import datetime, timedelta
        one_min_ago = datetime.utcnow() - timedelta(minutes=1)
        recent_log = db.query(models.ActuatorLogDB).filter(
            models.ActuatorLogDB.sensor_type == sensor_type,
            models.ActuatorLogDB.action == action,
            models.ActuatorLogDB.timestamp >= one_min_ago
        ).first()
        
        if not recent_log:
            record_actuator_log(
                db,
                action=action,
                sensor_type=sensor_type,
                predicted_value=value,
                actual_value=value,
                power_consumption=power,
                cause=cause,
                crop_name=ACTIVE_CROP,
            )
            
    return db_data

@router.get("/current", response_model=List[models.SensorDataResponse])
def get_current_sensors(db: Session = Depends(database.get_db)):
    # Get latest reading for each sensor type
    sensor_types = db.query(models.SensorDataDB.sensor_type).distinct().all()
    results = []
    for stype in sensor_types:
        latest = db.query(models.SensorDataDB).filter(
            models.SensorDataDB.sensor_type == stype[0]
        ).order_by(models.SensorDataDB.timestamp.desc()).first()
        if latest:
            results.append(latest)
    return results

@router.get("/{sensor_type}/history", response_model=List[models.SensorDataResponse])
def get_sensor_history(sensor_type: str, limit: int = 100, db: Session = Depends(database.get_db)):
    data = db.query(models.SensorDataDB).filter(
        models.SensorDataDB.sensor_type == sensor_type
    ).order_by(models.SensorDataDB.timestamp.desc()).limit(limit).all()
    return data
