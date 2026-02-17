"""
Harit Swaraj MRV System - Main API
Production-ready FastAPI application with authentication, database, and ML integration
"""
from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import os

# Local imports
from database import get_db, init_db
from models import User
from auth import hash_password
from file_storage import UPLOAD_DIR

# Routers
from routers import auth, plot, harvest, transport, manufacturing, distribution, audit, blockchain, dashboard

# Initialize FastAPI app
app = FastAPI(
    title="Harit Swaraj MRV API",
    description="Production-ready API for biochar carbon credit verification",
    version="2.0.0"
)

# CORS middleware
ALLOWED_ORIGINS = os.getenv("CORS_ORIGINS", "").split(",") if os.getenv("CORS_ORIGINS") else [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://0.0.0.0:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    """Initialize database and create default users"""
    init_db()
    
    # Create default users if they don't exist
    db = next(get_db())
    try:
        # Check if admin exists
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            # Create default users for testing
            default_users = [
                User(
                    username="admin",
                    email="admin@haritswaraj.com",
                    password_hash=hash_password("admin123"),
                    role="admin",
                    full_name="System Administrator"
                ),
                User(
                    username="owner1",
                    email="owner@haritswaraj.com",
                    password_hash=hash_password("owner123"),
                    role="owner",
                    full_name="Biochar Plant Owner"
                ),
                User(
                    username="farmer1",
                    email="farmer@haritswaraj.com",
                    password_hash=hash_password("farmer123"),
                    role="farmer",
                    full_name="Biomass Farmer"
                ),
                User(
                    username="auditor1",
                    email="auditor@haritswaraj.com",
                    password_hash=hash_password("auditor123"),
                    role="auditor",
                    full_name="Carbon Credit Auditor"
                )
            ]
            db.add_all(default_users)
            db.commit()
            print("[OK] Default users created")
    except Exception as e:
        print(f"⚠️ Error initializing database content: {e}")
    finally:
        db.close()

# Mount static files for serving uploads
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Include Routers
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(plot.router)
app.include_router(harvest.router)
app.include_router(transport.router)
app.include_router(manufacturing.router)
app.include_router(distribution.router)
app.include_router(audit.router)
app.include_router(blockchain.router)

@app.get("/")
async def root():
    return {"message": "Harit Swaraj MRV API is running"}
