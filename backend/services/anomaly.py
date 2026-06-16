from sqlalchemy.orm import Session
from .. import models
import json

def check_for_anomalies(db: Session, data: models.SensorDataCreate):
    # Retrieve the currently active crop
    from ..routers.crops import ACTIVE_CROP
    crop = db.query(models.CropProfileDB).filter(models.CropProfileDB.name == ACTIVE_CROP).first()
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
    alert = None
    
    # Map soil_moisture sensor to nutrition limits
    range_key = "nutrition" if sensor_type == "soil_moisture" else sensor_type
    crop_range = ranges.get(range_key)
    
    if crop_range:
        min_val = crop_range.get("min")
        max_val = crop_range.get("max")
        span = max_val - min_val if max_val > min_val else 10.0
        
        # Warning if outside bounds, Critical if it deviates by more than 30% of the target range span
        if value > max_val:
            deviation = value - max_val
            severity = "critical" if deviation > (span * 0.3) else "warning"
            alert = models.AlertDB(
                sensor_type=sensor_type,
                message=f"High {sensor_type.replace('_', ' ')}: {value:.1f} exceeding {ACTIVE_CROP} limit of {max_val:.1f}",
                severity=severity
            )
        elif value < min_val:
            deviation = min_val - value
            severity = "critical" if deviation > (span * 0.3) else "warning"
            alert = models.AlertDB(
                sensor_type=sensor_type,
                message=f"Low {sensor_type.replace('_', ' ')}: {value:.1f} below {ACTIVE_CROP} limit of {min_val:.1f}",
                severity=severity
            )
            
    if alert:
        db.add(alert)
        db.commit()
        db.refresh(alert)
        
        # Dispatch notification to n8n webhook only if severity is critical and has not been triggered recently
        if alert.severity == "critical":
            from datetime import datetime, timedelta
            # Check if we triggered a critical alert for this sensor type in the last 5 minutes
            five_mins_ago = datetime.utcnow() - timedelta(minutes=5)
            recent_alert = db.query(models.AlertDB).filter(
                models.AlertDB.sensor_type == sensor_type,
                models.AlertDB.severity == "critical",
                models.AlertDB.timestamp >= five_mins_ago,
                models.AlertDB.id != alert.id
            ).first()
            
            if not recent_alert:
                from .webhooks import trigger_n8n_webhook
                trigger_n8n_webhook("critical_alert", {
                    "id": alert.id,
                    "sensor_type": alert.sensor_type,
                    "message": alert.message,
                    "severity": alert.severity,
                    "value": alert.severity,
                    "timestamp": alert.timestamp.isoformat() if alert.timestamp else None
                })
            else:
                print(f"[Webhook Rate-Limit] Skipped dispatch for critical {sensor_type} alert (already triggered in last 5 mins).")
        
        return alert
    return None
