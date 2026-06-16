from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from ..database import get_db
from .. import models as db_models

router = APIRouter(prefix="/logs", tags=["logs"])

@router.get("/actuators")
async def get_actuator_logs(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
):
    """Return actuator logs for the past *days* days (default 30)."""
    start = datetime.utcnow() - timedelta(days=days)
    logs = (
        db.query(db_models.ActuatorLogDB)
        .filter(db_models.ActuatorLogDB.timestamp >= start)
        .order_by(db_models.ActuatorLogDB.timestamp.desc())
        .all()
    )
    return [
        {
            "id": l.id,
            "timestamp": l.timestamp,
            "action": l.action,
            "sensor_type": l.sensor_type,
            "predicted_value": l.predicted_value,
            "actual_value": l.actual_value,
            "power_consumption": l.power_consumption,
            "cause": l.cause,
            "crop_name": l.crop_name,
        }
        for l in logs
    ]
