from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from datetime import timedelta
import os, shutil, uuid

from database import get_db
from models import User
from schemas import UserRegister, UserLogin, Token, UserResponse, ProfileUpdate
from auth import (
    authenticate_user, create_access_token, get_current_user, hash_password
)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads", "profile_photos")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(status_code=400, detail="Username taken")
        
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email taken")
        
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        role=user_data.role,
        full_name=user_data.full_name
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = create_access_token(data={"sub": new_user.username})
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
            "role": new_user.role,
            "full_name": new_user.full_name,
            "phone_number": new_user.phone_number,
            "aadhaar_number": new_user.aadhaar_number,
            "address": new_user.address,
            "photo_url": new_user.photo_url
        }
    }

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db, credentials.username, credentials.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    access_token = create_access_token(data={"sub": user.username})
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "full_name": user.full_name,
            "phone_number": user.phone_number,
            "aadhaar_number": user.aadhaar_number,
            "address": user.address,
            "photo_url": user.photo_url
        }
    }

@router.get("/me", response_model=UserResponse)
async def get_my_info(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/profile", response_model=UserResponse)
async def update_profile(
    profile_data: ProfileUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update user profile information"""
    user = db.query(User).filter(User.id == current_user.id).first()
    
    if profile_data.full_name is not None:
        user.full_name = profile_data.full_name
    if profile_data.phone_number is not None:
        user.phone_number = profile_data.phone_number
    if profile_data.aadhaar_number is not None:
        user.aadhaar_number = profile_data.aadhaar_number
    if profile_data.address is not None:
        user.address = profile_data.address
        
    db.commit()
    db.refresh(user)
    return user

@router.post("/profile/photo", response_model=UserResponse)
async def upload_profile_photo(
    photo: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload a profile photo for the current user"""
    # Validate file type
    if not photo.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")
    
    # Generate unique filename
    ext = os.path.splitext(photo.filename)[1] or ".jpg"
    filename = f"{current_user.id}_{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    # Save the file
    with open(filepath, "wb") as f:
        shutil.copyfileobj(photo.file, f)
    
    # Delete old photo if exists
    if current_user.photo_url:
        old_filename = current_user.photo_url.split("/uploads/profile_photos/")[-1]
        old_path = os.path.join(UPLOAD_DIR, old_filename)
        if os.path.exists(old_path):
            os.remove(old_path)
    
    # Update DB
    user = db.query(User).filter(User.id == current_user.id).first()
    user.photo_url = f"/uploads/profile_photos/{filename}"
    db.commit()
    db.refresh(user)
    return user
