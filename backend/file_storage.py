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
    
    Args:
        original_filename: Original file name
        prefix: Optional prefix (e.g., 'plot_PLT001_photo_0')
    
    Returns:
        Unique filename with extension
    """
    # Get file extension
    ext = Path(original_filename).suffix
    
    # Generate unique ID
    unique_id = uuid.uuid4().hex[:8]
    
    # Combine prefix, unique ID, and extension
    if prefix:
        return f"{prefix}_{unique_id}{ext}"
    else:
        return f"{unique_id}{ext}"

async def save_photo(file: UploadFile, plot_id: str, photo_index: int) -> str:
    """
    Save a plot photo
    
    Args:
        file: Uploaded file
        plot_id: Plot ID
        photo_index: Photo index (0-3)
    
    Returns:
        Relative file path
    """
    filename = generate_unique_filename(
        file.filename,
        prefix=f"plot_{plot_id}_photo_{photo_index}"
    )
    file_path = os.path.join(PHOTOS_DIR, filename)
    
    # Save file
    content = await file.read()
    with open(file_path, 'wb') as f:
        f.write(content)
    
    # Return relative path
    return f"photos/{filename}"

async def save_video(file: UploadFile, batch_id: str) -> str:
    """
    Save a manufacturing video
    
    Args:
        file: Uploaded file
        batch_id: Batch ID
    
    Returns:
        Relative file path
    """
    filename = generate_unique_filename(
        file.filename,
        prefix=f"batch_{batch_id}"
    )
    file_path = os.path.join(VIDEOS_DIR, filename)
    
    # Save file
    content = await file.read()
    with open(file_path, 'wb') as f:
        f.write(content)
    
    # Return relative path
    return f"videos/{filename}"

async def save_kml(file: UploadFile, plot_id: str) -> str:
    """
    Save a KML file
    
    Args:
        file: Uploaded file
        plot_id: Plot ID
    
    Returns:
        Relative file path
    """
    filename = generate_unique_filename(
        file.filename,
        prefix=f"plot_{plot_id}"
    )
    file_path = os.path.join(KML_DIR, filename)
    
    # Save file
    content = await file.read()
    with open(file_path, 'wb') as f:
        f.write(content)
    
    # Return relative path
    return f"kml/{filename}"

def get_file_path(relative_path: str) -> Optional[str]:
    """
    Get absolute file path from relative path
    
    Args:
        relative_path: Relative path (e.g., 'photos/plot_PLT001_photo_0_abc123.jpg')
    
    Returns:
        Absolute file path if exists, None otherwise
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
    
    Args:
        relative_path: Relative path to file
    
    Returns:
        True if deleted, False otherwise
    """
    file_path = get_file_path(relative_path)
    if file_path and os.path.exists(file_path):
        os.remove(file_path)
        return True
    return False
