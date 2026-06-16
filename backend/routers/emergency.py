# backend/routers/emergency.py
# FastAPI router for emergency webhook (demo button & n8n trigger)

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from .. import models, database
from datetime import datetime

router = APIRouter(
    prefix="/emergency",
    tags=["emergency"],
)

@router.post("/trigger")
async def trigger_emergency(
    action: str = Query(..., description="actuator type, e.g., 'heater' or 'ventilation'"),
    value: float = Query(..., description="command value, e.g., 1 for on, 0 for off"),
    token: str = Query(None, description="shared secret token for basic auth"),
    db: Session = Depends(database.get_db),
):
    # Validate token (simple check, replace with env var if needed)
    if token != "demo123":
        raise HTTPException(status_code=401, detail="Invalid token")

    # Reuse actuator processing logic
    command = models.ActuatorCommandCreate(actuator_type=action, command_value=value)
    # Insert command into DB
    db_command = models.ActuatorCommandDB(**command.model_dump())
    db.add(db_command)
    db.commit()
    db.refresh(db_command)

    # Create an alert to surface in UI
    db_alert = models.AlertDB(
        sensor_type=action,
        message=f"Emergency trigger: {action} set to {value}",
        severity="critical",
        is_resolved=False,
    )
    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)
    
    # Dispatch emergency trigger event to n8n webhook
    from ..services.webhooks import trigger_n8n_webhook
    trigger_n8n_webhook("critical_alert", {
        "id": db_alert.id,
        "sensor_type": db_alert.sensor_type,
        "message": db_alert.message,
        "severity": db_alert.severity,
        "value": db_alert.severity,
        "timestamp": db_alert.timestamp.isoformat() if db_alert.timestamp else None
    })
    
    return {"status": "triggered", "command_id": db_command.id}
