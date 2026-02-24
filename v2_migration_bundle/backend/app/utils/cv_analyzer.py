"""
Computer Vision Analyzer for Harit Swaraj
Analyzes uploaded photos for quality, authenticity, and biochar presence
"""
import cv2
import numpy as np
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS
import imagehash
import exifread
from datetime import datetime
from typing import Dict, Optional, Tuple, List
import os


def extract_exif(image_path: str) -> Dict:
    """
    Extract EXIF metadata from image including GPS coordinates
    
    Args:
        image_path: Path to image file
        
    Returns:
        Dictionary with EXIF data including GPS, timestamp, camera info
    """
    result = {
        'has_gps': False,
        'gps_coordinates': None,
        'timestamp': None,
        'camera_make': None,
        'camera_model': None
    }
    
    try:
        # Open image with PIL to get EXIF
        image = Image.open(image_path)
        exif_data = image._getexif()
        
        if not exif_data:
            return result
        
        # Extract basic EXIF info
        for tag_id, value in exif_data.items():
            tag = TAGS.get(tag_id, tag_id)
            
            if tag == 'Make':
                result['camera_make'] = str(value)
            elif tag == 'Model':
                result['camera_model'] = str(value)
            elif tag == 'DateTime':
                try:
                    result['timestamp'] = datetime.strptime(str(value), '%Y:%m:%d %H:%M:%S').isoformat()
                except:
                    result['timestamp'] = str(value)
            elif tag == 'GPSInfo':
                # Extract GPS coordinates
                gps_data = {}
                for gps_tag_id in value:
                    gps_tag = GPSTAGS.get(gps_tag_id, gps_tag_id)
                    gps_data[gps_tag] = value[gps_tag_id]
                
                # Convert GPS to decimal degrees
                if 'GPSLatitude' in gps_data and 'GPSLongitude' in gps_data:
                    lat = _convert_to_degrees(gps_data['GPSLatitude'])
                    lon = _convert_to_degrees(gps_data['GPSLongitude'])
                    
                    # Apply direction (N/S, E/W)
                    if gps_data.get('GPSLatitudeRef') == 'S':
                        lat = -lat
                    if gps_data.get('GPSLongitudeRef') == 'W':
                        lon = -lon
                    
                    result['has_gps'] = True
                    result['gps_coordinates'] = [lat, lon]
    
    except Exception as e:
        print(f"⚠️ EXIF extraction error: {e}")
    
    return result


def _convert_to_degrees(value) -> float:
    """Convert GPS coordinates to decimal degrees"""
    d, m, s = value
    return float(d) + float(m) / 60.0 + float(s) / 3600.0


def check_quality(image_path: str) -> Dict:
    """
    Check image quality (blur, brightness, resolution)
    
    Args:
        image_path: Path to image file
        
    Returns:
        Dictionary with quality metrics
    """
    result = {
        'blur_score': 0.0,
        'brightness': 0.0,
        'resolution': [0, 0],
        'file_size_mb': 0.0,
        'warnings': []
    }
    
    try:
        # Read image
        image = cv2.imread(image_path)
        if image is None:
            result['warnings'].append('Failed to read image')
            return result
        
        # Get resolution
        height, width = image.shape[:2]
        result['resolution'] = [width, height]
        
        # Check resolution
        if width < 800 or height < 600:
            result['warnings'].append('Low resolution (minimum 800x600 recommended)')
        
        # Convert to grayscale for blur detection
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Calculate blur score using Laplacian variance
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        # Normalize to 0-1 scale (higher = sharper)
        result['blur_score'] = min(laplacian_var / 500.0, 1.0)
        
        if result['blur_score'] < 0.3:
            result['warnings'].append('Image appears blurry')
        
        # Calculate brightness (mean pixel value)
        result['brightness'] = gray.mean() / 255.0
        
        if result['brightness'] < 0.2:
            result['warnings'].append('Very dark image')
        elif result['brightness'] > 0.9:
            result['warnings'].append('Overexposed image')
        
        # Get file size
        file_size = os.path.getsize(image_path)
        result['file_size_mb'] = file_size / (1024 * 1024)
        
        if result['file_size_mb'] > 10:
            result['warnings'].append('Large file size (>10MB)')
    
    except Exception as e:
        print(f"⚠️ Quality check error: {e}")
        result['warnings'].append(f'Quality check failed: {str(e)}')
    
    return result


def detect_biochar(image_path: str) -> Dict:
    """
    Detect biochar presence using color analysis
    
    Args:
        image_path: Path to image file
        
    Returns:
        Dictionary with biochar detection results
    """
    result = {
        'biochar_detected': False,
        'biochar_confidence': 0.0,
        'dark_pixel_ratio': 0.0,
        'dominant_colors': []
    }
    
    try:
        # Read image
        image = cv2.imread(image_path)
        if image is None:
            return result
        
        # Convert to HSV for better color analysis
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        
        # Define range for dark/black colors (biochar)
        # Biochar is typically very dark (low V in HSV)
        lower_dark = np.array([0, 0, 0])
        upper_dark = np.array([180, 255, 80])  # V < 80 (out of 255)
        
        # Create mask for dark pixels
        dark_mask = cv2.inRange(hsv, lower_dark, upper_dark)
        
        # Calculate ratio of dark pixels
        total_pixels = image.shape[0] * image.shape[1]
        dark_pixels = cv2.countNonZero(dark_mask)
        result['dark_pixel_ratio'] = dark_pixels / total_pixels
        
        # Biochar detection logic
        # If >15% of pixels are dark, likely biochar present
        if result['dark_pixel_ratio'] > 0.15:
            result['biochar_detected'] = True
            result['biochar_confidence'] = min(result['dark_pixel_ratio'] * 3, 1.0)
        
        # Get dominant colors (simplified)
        # Reshape image to list of pixels
        pixels = image.reshape(-1, 3)
        # Calculate mean color
        mean_color = pixels.mean(axis=0).astype(int).tolist()
        result['dominant_colors'] = [mean_color]
    
    except Exception as e:
        print(f"⚠️ Biochar detection error: {e}")
    
    return result


def calculate_perceptual_hash(image_path: str) -> str:
    """
    Calculate perceptual hash for duplicate detection
    
    Args:
        image_path: Path to image file
        
    Returns:
        Perceptual hash string
    """
    try:
        image = Image.open(image_path)
        # Use average hash (fast and effective)
        phash = imagehash.average_hash(image)
        return str(phash)
    except Exception as e:
        print(f"⚠️ Hash calculation error: {e}")
        return ""


def check_duplicate(image_hash: str, existing_hashes: List[str], threshold: int = 5) -> Tuple[bool, float]:
    """
    Check if image is duplicate of existing images
    
    Args:
        image_hash: Perceptual hash of new image
        existing_hashes: List of existing image hashes
        threshold: Hamming distance threshold (lower = more similar)
        
    Returns:
        Tuple of (is_duplicate, similarity_score)
    """
    if not image_hash or not existing_hashes:
        return False, 0.0
    
    try:
        new_hash = imagehash.hex_to_hash(image_hash)
        
        for existing_hash_str in existing_hashes:
            if not existing_hash_str:
                continue
            
            existing_hash = imagehash.hex_to_hash(existing_hash_str)
            distance = new_hash - existing_hash
            
            if distance <= threshold:
                # Calculate similarity (0-1, higher = more similar)
                similarity = 1.0 - (distance / 64.0)  # 64 is max hamming distance
                return True, similarity
        
        return False, 0.0
    
    except Exception as e:
        print(f"⚠️ Duplicate check error: {e}")
        return False, 0.0


def analyze_photo(image_path: str, existing_hashes: Optional[List[str]] = None) -> Dict:
    """
    Complete photo analysis pipeline
    
    Args:
        image_path: Path to image file
        existing_hashes: Optional list of existing image hashes for duplicate detection
        
    Returns:
        Complete analysis results dictionary
    """
    # Initialize result
    result = {
        'quality_score': 0.0,
        'has_gps': False,
        'gps_coordinates': None,
        'timestamp': None,
        'camera_make': None,
        'camera_model': None,
        'blur_score': 0.0,
        'brightness': 0.0,
        'resolution': [0, 0],
        'biochar_detected': False,
        'biochar_confidence': 0.0,
        'dark_pixel_ratio': 0.0,
        'perceptual_hash': '',
        'is_duplicate': False,
        'duplicate_similarity': 0.0,
        'warnings': [],
        'analysis_timestamp': datetime.utcnow().isoformat()
    }
    
    try:
        # 1. Extract EXIF metadata
        exif_data = extract_exif(image_path)
        result.update(exif_data)
        
        if not result['has_gps']:
            result['warnings'].append('No GPS coordinates found')
        
        # 2. Check image quality
        quality_data = check_quality(image_path)
        result['blur_score'] = quality_data['blur_score']
        result['brightness'] = quality_data['brightness']
        result['resolution'] = quality_data['resolution']
        result['warnings'].extend(quality_data['warnings'])
        
        # 3. Detect biochar
        biochar_data = detect_biochar(image_path)
        result['biochar_detected'] = biochar_data['biochar_detected']
        result['biochar_confidence'] = biochar_data['biochar_confidence']
        result['dark_pixel_ratio'] = biochar_data['dark_pixel_ratio']
        
        # 4. Calculate perceptual hash
        result['perceptual_hash'] = calculate_perceptual_hash(image_path)
        
        # 5. Check for duplicates
        if existing_hashes:
            is_dup, similarity = check_duplicate(result['perceptual_hash'], existing_hashes)
            result['is_duplicate'] = is_dup
            result['duplicate_similarity'] = similarity
            
            if is_dup:
                result['warnings'].append(f'Possible duplicate image (similarity: {similarity:.2%})')
        
        # 6. Calculate overall quality score
        # Weighted average of different factors
        quality_factors = []
        
        # Blur score (weight: 0.3)
        quality_factors.append(result['blur_score'] * 0.3)
        
        # Brightness (weight: 0.2) - penalize very dark or very bright
        brightness_score = 1.0 - abs(result['brightness'] - 0.5) * 2
        quality_factors.append(brightness_score * 0.2)
        
        # GPS presence (weight: 0.2)
        quality_factors.append(0.2 if result['has_gps'] else 0.0)
        
        # Resolution (weight: 0.15)
        width, height = result['resolution']
        resolution_score = min((width * height) / (1920 * 1080), 1.0)
        quality_factors.append(resolution_score * 0.15)
        
        # No duplicate (weight: 0.15)
        quality_factors.append(0.0 if result['is_duplicate'] else 0.15)
        
        result['quality_score'] = sum(quality_factors)
        
        # Add overall quality warning
        if result['quality_score'] < 0.5:
            result['warnings'].append('Overall low quality score')
    
    except Exception as e:
        print(f"⚠️ Photo analysis error: {e}")
        result['warnings'].append(f'Analysis failed: {str(e)}')
    
    return result


# Mock function for testing without actual images
def mock_analyze_photo() -> Dict:
    """
    Mock photo analysis for testing
    """
    return {
        'quality_score': 0.85,
        'has_gps': True,
        'gps_coordinates': [28.6139, 77.2090],
        'timestamp': datetime.utcnow().isoformat(),
        'camera_make': 'Test Camera',
        'camera_model': 'Model X',
        'blur_score': 0.92,
        'brightness': 0.65,
        'resolution': [1920, 1080],
        'biochar_detected': True,
        'biochar_confidence': 0.78,
        'dark_pixel_ratio': 0.35,
        'perceptual_hash': 'abc123def456',
        'is_duplicate': False,
        'duplicate_similarity': 0.0,
        'warnings': [],
        'analysis_timestamp': datetime.utcnow().isoformat()
    }
