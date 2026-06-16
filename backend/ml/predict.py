# ML prediction utilities for Greenhouse Automation
"""Provides a simple prediction interface.

In production this would load a trained model (e.g., via joblib) and
return a forecasted sensor value. For now we supply a lightweight stub
that returns a random value within a realistic range for the requested
sensor type.
"""
import random
from typing import Union

def predict_next(sensor_type: str) -> Union[float, int]:
    """Return a dummy prediction for *sensor_type*.

    Args:
        sensor_type: Name of the sensor (e.g., "temperature",
            "humidity", "soil_moisture", "co2").

    Returns:
        A float representing the predicted sensor reading.
    """
    # Simple placeholder ranges – adjust as needed when a real model is added.
    ranges = {
        "temperature": (18, 30),
        "humidity": (40, 80),
        "soil_moisture": (20, 70),
        "co2": (300, 800),
    }
    low, high = ranges.get(sensor_type, (0, 100))
    return random.uniform(low, high)
