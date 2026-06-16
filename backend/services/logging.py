from typing import Optional
from sqlalchemy.orm import Session
from .. import models

def record_actuator_log(
    db: Session,
    action: str,
    sensor_type: str,
    predicted_value: float,
    actual_value: Optional[float] = None,
    power_consumption: float = 0.0,
    cause: str = "",
    crop_name: Optional[str] = None,
) -> None:
    """Create a log entry for an actuator action.

    Args:
        db: SQLAlchemy Session
        action: Action identifier (e.g., "fan_on")
        sensor_type: Related sensor type used for prediction
        predicted_value: Predicted sensor reading at time of action
        actual_value: Measured value if available
        power_consumption: Estimated power consumption for the action
        cause: Human‑readable explanation why the action was taken
        crop_name: Optional name of the crop context
    """
    log_entry = models.ActuatorLogDB(
        action=action,
        sensor_type=sensor_type,
        predicted_value=predicted_value,
        actual_value=actual_value,
        power_consumption=power_consumption,
        cause=cause,
        crop_name=crop_name,
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)

    # Dispatch trigger event to n8n webhook only if it is critical (e.g. emergency or manual dispatch)
    severity_val = "critical" if log_entry.cause and ("Emergency" in log_entry.cause or "Manual" in log_entry.cause) else "info"
    if severity_val == "critical":
        from .webhooks import trigger_n8n_webhook
        trigger_n8n_webhook("actuator_activation", {
            "id": log_entry.id,
            "action": log_entry.action,
            "sensor_type": log_entry.sensor_type,
            "predicted_value": log_entry.predicted_value,
            "actual_value": log_entry.actual_value,
            "power_consumption": log_entry.power_consumption,
            "cause": log_entry.cause,
            "crop_name": log_entry.crop_name,
            "severity": severity_val,
            "value": severity_val,
            "timestamp": log_entry.timestamp.isoformat() if log_entry.timestamp else None
        })
