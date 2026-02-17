"""
File storage utilities for Harit Swaraj
Handles saving and retrieving uploaded files (images, videos, KML)
"""
import os
import uuid
from pathlib import Path
from fastapi import UploadFile
from typing import Optional

# Base upload directory
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), 'uploads')

# Subdirectories for different file types
PHOTOS_DIR = os.path.join(UPLOAD_DIR, 'photos')
VIDEOS_DIR = os.path.join(UPLOAD_DIR, 'videos')
KML_DIR = os.path.join(UPLOAD_DIR, 'kml')

# Create directories if they don't exist
for directory in [UPLOAD_DIR, PHOTOS_DIR, VIDEOS_DIR, KML_DIR]:
    os.makedirs(directory, exist_ok=True)

def generate_unique_filename(original_filename: str, prefix: str = "") -> str:
    """
    Generate a unique filename with UUID
    """
    ext = Path(original_filename).suffix
    unique_id = uuid.uuid4().hex[:8]
    
    if prefix:
        return f"{prefix}_{unique_id}{ext}"
    else:
        return f"{unique_id}{ext}"

async def save_photo(file: UploadFile, prefix: str, photo_index: Optional[int] = None) -> str:
    """
    Save a photo (generic)
    """
    if photo_index is not None:
        file_prefix = f"photo_{prefix}_{photo_index}"
    else:
        file_prefix = prefix
        
    filename = generate_unique_filename(
        file.filename,
        prefix=file_prefix
    )
    file_path = os.path.join(PHOTOS_DIR, filename)
    
    await file.seek(0)
    content = await file.read()
    with open(file_path, 'wb') as f:
        f.write(content)
    
    return f"photos/{filename}"

async def save_video(file: UploadFile, batch_id: str) -> str:
    """
    Save a manufacturing video
    """
    filename = generate_unique_filename(
        file.filename,
        prefix=f"batch_{batch_id}"
    )
    file_path = os.path.join(VIDEOS_DIR, filename)
    
    await file.seek(0)
    content = await file.read()
    with open(file_path, 'wb') as f:
        f.write(content)
    
    return f"videos/{filename}"

async def save_kml(file: UploadFile, prefix: str) -> str:
    """
    Save a KML file (generic)
    """
    filename = generate_unique_filename(
        file.filename,
        prefix=f"kml_{prefix}"
    )
    file_path = os.path.join(KML_DIR, filename)
    
    await file.seek(0)
    content = await file.read()
    with open(file_path, 'wb') as f:
        f.write(content)
    
    return f"kml/{filename}"

def get_file_path(relative_path: str) -> Optional[str]:
    """
    Get absolute file path from relative path
    """
    if not relative_path:
        return None
    
    file_path = os.path.join(UPLOAD_DIR, relative_path)
    
    if os.path.exists(file_path):
        return file_path
    else:
        return None

def delete_file(relative_path: str) -> bool:
    """
    Delete a file
    """
    file_path = get_file_path(relative_path)
    if file_path and os.path.exists(file_path):
        os.remove(file_path)
        return True
    return False
