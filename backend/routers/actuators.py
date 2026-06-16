from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, database

router = APIRouter(
    prefix="/control",
    tags=["control"],
)

@router.post("/actuator")
def control_actuator(payload: dict, db: Session = Depends(database.get_db)):
    """Generic actuator endpoint that expects a JSON payload with:
        - "crop_name": str (required)
        - any actuator‑specific fields (e.g., "action": "fan_on")
    It fetches the crop profile, runs the prediction for the relevant sensor,
    decides whether to actuate, logs the action, and returns a status.
    """
    crop_name = payload.get("crop_name")
    if not crop_name:
        raise HTTPException(status_code=400, detail="crop_name required")
    # Load crop profile
    crop = db.query(models.CropProfileDB).filter(models.CropProfileDB.name == crop_name).first()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")
    import json
    ranges = json.loads(crop.ranges_json)
    # Example: assume payload contains "sensor_type" and "action"
    sensor_type = payload.get("sensor_type")
    action = payload.get("action")
    if not sensor_type or not action:
        raise HTTPException(status_code=400, detail="sensor_type and action required")
    # Run prediction for this sensor
    from ..ml import predict as ml_predict
    predicted = ml_predict.predict_next(sensor_type)
    # Determine if prediction exceeds max threshold for this crop
    sensor_range = ranges.get(sensor_type)
    trigger = False
    cause = ""
    if sensor_range and predicted > sensor_range.get("max", float('inf')):
        trigger = True
        cause = f"Manual: Predicted {sensor_type} {predicted:.2f} > max {sensor_range['max']} for {crop_name}"
    # Here you would actually send command to hardware (mocked)
    # Record log regardless of trigger (optional: only when triggered)
    from ..services.logging import record_actuator_log
    power_map = {
        "fan_on": 50.0,
        "vent_open": 20.0,
        "light_on": 30.0,
        "irrigate": 40.0,
    }
    power = power_map.get(action, 10.0)
    record_actuator_log(
        db,
        action=action,
        sensor_type=sensor_type,
        predicted_value=predicted,
        actual_value=None,
        power_consumption=power,
        cause=cause if cause else "Manual override dispatch",
        crop_name=crop_name,
    )
    return {"status": "executed", "triggered": trigger, "predicted": predicted, "cause": cause if cause else "Manual override dispatch"}


@router.get("/actuators/history", response_model=List[models.ActuatorCommandResponse])
def get_actuator_history(limit: int = 50, db: Session = Depends(database.get_db)):
    return db.query(models.ActuatorCommandDB).order_by(models.ActuatorCommandDB.timestamp.desc()).limit(limit).all()
