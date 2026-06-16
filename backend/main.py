from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import glob
import shutil
from . import models
from .database import engine
from .routers import sensors, actuators, crops, logs, emergency

# Create database tables
models.Base.metadata.create_all(bind=engine)

# Seed crops if table is empty
from .database import SessionLocal
from .seed.crop_profiles import seed_crops
db = SessionLocal()
try:
    seed_crops(db)
finally:
    db.close()

app = FastAPI(
    title="Greenhouse Controller API",
    description="API for managing the Automated Greenhouse Controller",
    version="1.0.0",
)

@app.on_event("startup")
def copy_assets():
    src_dir = r"C:\Users\pavan\.gemini\antigravity-ide\brain\a7d5c806-1b25-4c4c-9716-06daa86fed9d"
    dest_dir = r"c:\GreenHouse-Auto\frontend\src\assets"
    os.makedirs(dest_dir, exist_ok=True)
    
    patterns = {
        "hero_agriculture": "hero_agriculture.png",
        "tech_irrigation": "tech_irrigation.png",
        "organic_fertilizer": "organic_fertilizer.png",
        "user_avatar": "user_avatar.png",
        "greenhouse_monitoring": "greenhouse_monitoring.png"
    }
    
    for key, dest_name in patterns.items():
        search_path = os.path.join(src_dir, f"{key}*.png")
        files = glob.glob(search_path)
        if files:
            files.sort(key=os.path.getmtime, reverse=True)
            src_file = files[0]
            dest_file = os.path.join(dest_dir, dest_name)
            try:
                shutil.copy2(src_file, dest_file)
                print(f"Successfully copied {src_file} to {dest_file}")
            except Exception as e:
                print(f"Error copying {key}: {e}")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sensors.router)
app.include_router(actuators.router)
app.include_router(crops.router)
app.include_router(logs.router)
app.include_router(emergency.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Greenhouse Controller API"}

