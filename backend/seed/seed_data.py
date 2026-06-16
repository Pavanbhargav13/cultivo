# Seed utility to generate fake historical sensor data
# This script creates 5,000 rows of temperature and humidity readings
# covering the last 5 days and inserts them into the SQLite DB
# (greenhouse.db). It is intended to be run once before the UI
# evaluation so that charts have data and ML models have input.

import random
from datetime import datetime, timedelta
from pathlib import Path

from sqlalchemy.orm import Session

# Local imports – the backend package is a Python package (has __init__.py)
from backend.database import SessionLocal, engine, Base
from backend.models import SensorDataDB

def generate_rows(num_rows: int = 5000, days: int = 5):
    """Generate a list of SensorDataDB objects.

    Args:
        num_rows: total rows to generate (both temperature and humidity combined).
        days: number of days back from now to span.
    Returns:
        List[SensorDataDB]
    """
    rows = []
    now = datetime.utcnow()
    start = now - timedelta(days=days)
    # Determine timestamps – random within the range
    for _ in range(num_rows // 2):  # temperature rows
        ts = start + (now - start) * random.random()
        temp = round(random.uniform(15.0, 35.0), 2)  # realistic greenhouse temps
        rows.append(
            SensorDataDB(
                sensor_type="temperature",
                value=temp,
                unit="C",
                timestamp=ts,
            )
        )
        # humidity row for the same timestamp
        humidity = round(random.uniform(30.0, 90.0), 2)
        rows.append(
            SensorDataDB(
                sensor_type="humidity",
                value=humidity,
                unit="%",
                timestamp=ts,
            )
        )
    # If odd number, add an extra temperature row
    if num_rows % 2:
        ts = start + (now - start) * random.random()
        rows.append(
            SensorDataDB(
                sensor_type="temperature",
                value=round(random.uniform(15.0, 35.0), 2),
                unit="C",
                timestamp=ts,
            )
        )
    return rows

def main():
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    try:
        rows = generate_rows()
        db.bulk_save_objects(rows)
        db.commit()
        print(f"Inserted {len(rows)} sensor rows into greenhouse.db")
    finally:
        db.close()

if __name__ == "__main__":
    main()
