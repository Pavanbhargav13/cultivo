from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean
from sqlalchemy.sql import func
from .database import Base
from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

# SQLAlchemy Models
class SensorDataDB(Base):
    __tablename__ = "sensor_data"

    id = Column(Integer, primary_key=True, index=True)
    sensor_type = Column(String, index=True)  # e.g., temperature, humidity, soil_moisture, co2
    value = Column(Float)
    unit = Column(String)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)

class AlertDB(Base):
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    sensor_type = Column(String, index=True)
    message = Column(String)
    severity = Column(String) # info, warning, critical
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    is_resolved = Column(Boolean, default=False)

# New crop profile model
class CropProfileDB(Base):
    __tablename__ = "crop_profiles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    category = Column(String, index=True)  # fruit, vegetable, fungi
    ranges_json = Column(String)  # JSON of min/max per sensor
    created_at = Column(DateTime, default=datetime.utcnow)

# New actuator log model
class ActuatorLogDB(Base):
    __tablename__ = "actuator_logs"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    action = Column(String, index=True)  # e.g., "fan_on"
    sensor_type = Column(String, index=True)
    predicted_value = Column(Float)
    actual_value = Column(Float, nullable=True)
    power_consumption = Column(Float)
    cause = Column(String)
    crop_name = Column(String, nullable=True)


class ActuatorCommandDB(Base):
    __tablename__ = "actuator_commands"
    
    id = Column(Integer, primary_key=True, index=True)
    actuator_type = Column(String, index=True) # heating, ventilation, misting
    command_value = Column(Float) # e.g., duty cycle or status
    timestamp = Column(DateTime(timezone=True), server_default=func.now())


# Pydantic Schemas
class SensorDataCreate(BaseModel):
    sensor_type: str
    value: float
    unit: str
    timestamp: Optional[datetime] = None

class SensorDataResponse(SensorDataCreate):
    id: int
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

class ActuatorCommandCreate(BaseModel):
    actuator_type: str
    command_value: float

class ActuatorCommandResponse(ActuatorCommandCreate):
    id: int
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

class AlertResponse(BaseModel):
    id: int
    sensor_type: str
    message: str
    severity: str
    timestamp: datetime
    is_resolved: bool

    model_config = ConfigDict(from_attributes=True)
