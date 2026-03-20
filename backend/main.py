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
from routers import (
    auth as auth_router, 
    plot as plot_router, 
    harvest as harvest_router, 
    transport as transport_router, 
    manufacturing as manufacturing_router, 
    distribution as distribution_router, 
    audit as audit_router, 
    blockchain as blockchain_router, 
    dashboard as dashboard_router, 
    customer as customer_router
)

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
    try:
        init_db()
        
        # Create default users for testing in a safe way
        import models
        from sqlalchemy import text
        
        db_generator = get_db()
        db = next(db_generator)
        try:
            # Force create users if missing
            for u_data in [
                ("admin", "admin@haritswaraj.com", "admin123", "admin", "System Administrator"),
                ("owner1", "owner@haritswaraj.com", "owner123", "owner", "Biochar Plant Owner"),
                ("farmer1", "farmer@haritswaraj.com", "farmer123", "farmer", "Biomass Farmer"),
                ("auditor1", "auditor@haritswaraj.com", "auditor123", "auditor", "Carbon Credit Auditor")
            ]:
                username, email, pwd, role, name = u_data
                exists = db.query(models.User).filter(models.User.username == username).first()
                if not exists:
                    print(f"Adding default user: {username}")
                    new_user = models.User(
                        username=username,
                        email=email,
                        password_hash=hash_password(pwd),
                        role=role,
                        full_name=name
                    )
                    db.add(new_user)
            db.commit()
            print("[OK] Startup verification complete.")
        except Exception as e:
            print(f"⚠️ Could not verify default users: {e}")
            db.rollback()
        finally:
            db.close()
    except Exception as e:
        print(f"❌ Critical Error during startup: {e}")
        # We don't re-raise here so the app can at least start and show logs

# Mount static files for serving uploads
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Include Routers
app.include_router(auth_router.router)
app.include_router(dashboard_router.router)
app.include_router(plot_router.router)
app.include_router(harvest_router.router)
app.include_router(transport_router.router)
app.include_router(manufacturing_router.router)
app.include_router(distribution_router.router)
app.include_router(audit_router.router)
app.include_router(blockchain_router.router)
app.include_router(customer_router.router)
from routers import admin
app.include_router(admin.router)

@app.get("/")
async def root():
    return {"message": "Harit Swaraj MRV API - VERSION 2.0.1"}
