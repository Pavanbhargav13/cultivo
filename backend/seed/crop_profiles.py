import json
from sqlalchemy.orm import Session
from .. import models as db_models

def seed_crops(db: Session):
    crops = [
        # --- Vegetables ---
        {
            "name": "Tomato",
            "category": "vegetable",
            "ranges": {
                "temperature": {"min": 22, "max": 27},
                "humidity": {"min": 60, "max": 80},
                "light": {"min": 500, "max": 1200},
                "co2": {"min": 400, "max": 800},
                "nutrition": {"min": 12, "max": 18}
            }
        },
        {
            "name": "Lettuce",
            "category": "vegetable",
            "ranges": {
                "temperature": {"min": 15, "max": 20},
                "humidity": {"min": 70, "max": 85},
                "light": {"min": 300, "max": 800},
                "co2": {"min": 350, "max": 700},
                "nutrition": {"min": 10, "max": 15}
            }
        },
        {
            "name": "Strawberry",
            "category": "fruit",
            "ranges": {
                "temperature": {"min": 18, "max": 22},
                "humidity": {"min": 65, "max": 80},
                "light": {"min": 400, "max": 900},
                "co2": {"min": 350, "max": 750},
                "nutrition": {"min": 11, "max": 16}
            }
        },
        # --- Fruits & Specialty ---
        {
            "name": "DragonFruit",
            "category": "fruit",
            "ranges": {
                "temperature": {"min": 24, "max": 30},
                "humidity": {"min": 55, "max": 70},
                "light": {"min": 700, "max": 1500},
                "co2": {"min": 400, "max": 900},
                "nutrition": {"min": 13, "max": 19}
            }
        },
        {
            "name": "Mushroom",
            "category": "fungi",
            "ranges": {
                "temperature": {"min": 16, "max": 22},
                "humidity": {"min": 85, "max": 95},
                "light": {"min": 0, "max": 200},
                "co2": {"min": 500, "max": 1200},
                "nutrition": {"min": 8, "max": 12}
            }
        }
    ]
    for c in crops:
        exists = db.query(db_models.CropProfileDB).filter(db_models.CropProfileDB.name == c["name"]).first()
        if not exists:
            db.add(
                db_models.CropProfileDB(
                    name=c["name"],
                    category=c.get("category"),
                    ranges_json=json.dumps(c["ranges"])
                )
            )
    db.commit()
