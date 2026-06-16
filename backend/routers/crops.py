from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models as db_models
import json

router = APIRouter(prefix="/crops", tags=["crops"])

ACTIVE_CROP = "Tomato"

@router.post("/{crop_name}/active")
async def set_active_crop(crop_name: str, db: Session = Depends(get_db)):
    global ACTIVE_CROP
    crop = db.query(db_models.CropProfileDB).filter(db_models.CropProfileDB.name == crop_name).first()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")
    ACTIVE_CROP = crop_name
    return {"status": "success", "active_crop": ACTIVE_CROP}

@router.get("/active/current")
async def get_active_crop():
    global ACTIVE_CROP
    return {"active_crop": ACTIVE_CROP}

@router.get("/")
async def list_crops(db: Session = Depends(get_db)):
    crops = db.query(db_models.CropProfileDB).all()
    return [c.name for c in crops]

@router.get("/{crop_name}")
async def get_crop(crop_name: str, db: Session = Depends(get_db)):
    crop = db.query(db_models.CropProfileDB).filter(db_models.CropProfileDB.name == crop_name).first()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")
    return {"name": crop.name, "category": crop.category, "ranges": json.loads(crop.ranges_json)}

