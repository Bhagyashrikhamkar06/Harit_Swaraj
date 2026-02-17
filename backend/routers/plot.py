from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime

from database import get_db
from models import User, Plot, PlotPhoto
from schemas import PlotResponse, PlotUpdate
from auth import get_current_user
from file_storage import save_photo, save_kml, get_file_path
try:
    from ml.plot_verification import get_plot_verifier
except ImportError:
    from ml.mock_ml import get_plot_verifier

# Initialize verification model
plot_verifier = get_plot_verifier()

import numpy as np

def sanitize_for_json(obj):
    """
    Recursively convert numpy types to native python types for JSON serialization
    """
    if isinstance(obj, dict):
        return {k: sanitize_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [sanitize_for_json(i) for i in obj]
    elif isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.bool_):
        return bool(obj)
    elif isinstance(obj, np.ndarray):
        return sanitize_for_json(obj.tolist())
    return obj

router = APIRouter(
    prefix="/biomass",
    tags=["Biomass Plots"]
)

@router.post("/register-plot", status_code=status.HTTP_201_CREATED)
async def register_plot(
    plot_id: str = Form(...),
    type: str = Form(...),
    species: str = Form(...),
    area: float = Form(...),
    expected_biomass: float = Form(...),
    photo_0: UploadFile = File(None),
    photo_1: UploadFile = File(None),
    photo_2: UploadFile = File(None),
    photo_3: UploadFile = File(None),
    kml_file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Register a new biomass plot (Farmer/Owner)
    """
    if current_user.role not in ['farmer', 'owner']:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    if db.query(Plot).filter(Plot.plot_id == plot_id).first():
        raise HTTPException(status_code=400, detail="Plot ID already exists")

    # Save KML
    kml_path = await save_kml(kml_file, plot_id)
    await kml_file.seek(0)
    kml_content = await kml_file.read()
    
    # Verify Plot
    verification = plot_verifier.verify_plot(kml_content.decode('utf-8', errors='ignore'), str(current_user.id), plot_id)
    initial_status = "verified" if verification.get("plot_status") == "verified" else "suspicious"

    new_plot = Plot(
        plot_id=plot_id,
        owner_id=current_user.id,
        type=type,
        species=species,
        area=area,
        expected_biomass=expected_biomass,
        status=initial_status,
        kml_file_path=kml_path,
        verification_data=sanitize_for_json(verification)
    )
    
    db.add(new_plot)
    db.commit()
    db.refresh(new_plot)
    
    # Import CV analyzer for GPS extraction
    try:
        from cv.cv_analyzer import extract_exif
    except ImportError:
        extract_exif = None
    
    # Process photos and extract GPS
    photos = [photo_0, photo_1, photo_2, photo_3]
    gps_coordinates_list = []
    
    for idx, photo in enumerate(photos):
        if photo:
            path = await save_photo(photo, f"{plot_id}_{idx}")
            
            # Extract GPS from photo
            has_gps_data = False
            gps_lat = None
            gps_lon = None
            photo_ts = None
            
            if extract_exif:
                try:
                    exif_info = extract_exif(path)
                    if exif_info.get('has_gps') and exif_info.get('gps_coordinates'):
                        has_gps_data = True
                        gps_lat = exif_info['gps_coordinates'][0]
                        gps_lon = exif_info['gps_coordinates'][1]
                        photo_ts = exif_info.get('timestamp')
                        gps_coordinates_list.append(exif_info['gps_coordinates'])
                        
                        # Store full analysis
                        cv_analysis = {
                            'camera_make': exif_info.get('camera_make'),
                            'camera_model': exif_info.get('camera_model'),
                            'timestamp': exif_info.get('timestamp')
                        }
                except Exception as e:
                    print(f"GPS extraction error for photo {idx}: {e}")
            
            plot_photo = PlotPhoto(
                plot_id=new_plot.id,
                photo_path=path,
                photo_index=idx,
                has_gps=1 if has_gps_data else 0,
                gps_latitude=gps_lat,
                gps_longitude=gps_lon,
                photo_timestamp=datetime.fromisoformat(photo_ts) if photo_ts else None,
                cv_analysis=sanitize_for_json(cv_analysis) if has_gps_data else None
            )
            db.add(plot_photo)
    
    # Update plot with average GPS coordinates if available
    if gps_coordinates_list:
        avg_lat = sum(coord[0] for coord in gps_coordinates_list) / len(gps_coordinates_list)
        avg_lon = sum(coord[1] for coord in gps_coordinates_list) / len(gps_coordinates_list)
        # Note: Plot model needs gps_latitude and gps_longitude fields
        # new_plot.gps_latitude = avg_lat
        # new_plot.gps_longitude = avg_lon
    
    db.commit()

    return {"message": "Plot registered", "plot_id": plot_id, "status": initial_status}

@router.get("/plots", response_model=List[PlotResponse])
async def get_plots(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Plot)
    if current_user.role == 'farmer':
        query = query.filter(Plot.owner_id == current_user.id)
    
    if status:
        query = query.filter(Plot.status == status)
        
    plots = query.all()
    
    # Populate photo_count
    for p in plots:
        p.photo_count = db.query(PlotPhoto).filter(PlotPhoto.plot_id == p.id).count()
        
    return plots
@router.get("/plots/{id}", response_model=PlotResponse)
async def get_plot(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    plot = db.query(Plot).filter(Plot.id == id).first()
    if not plot:
        raise HTTPException(status_code=404, detail="Plot not found")
        
    if current_user.role == 'farmer' and plot.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this plot")
        
    plot.photo_count = db.query(PlotPhoto).filter(PlotPhoto.plot_id == plot.id).count()
    return plot

@router.put("/plots/{id}", response_model=PlotResponse)
async def update_plot(
    id: int,
    plot_update: PlotUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    plot = db.query(Plot).filter(Plot.id == id).first()
    if not plot:
        raise HTTPException(status_code=404, detail="Plot not found")
        
    if current_user.role not in ['admin', 'owner'] or (current_user.role == 'owner' and plot.owner_id != current_user.id):
        if current_user.role != 'admin':
            raise HTTPException(status_code=403, detail="Not authorized to update this plot")

    update_data = plot_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(plot, key, value)
        
    db.commit()
    db.refresh(plot)
    plot.photo_count = db.query(PlotPhoto).filter(PlotPhoto.plot_id == plot.id).count()
    return plot

@router.delete("/plots/{id}")
async def delete_plot(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    plot = db.query(Plot).filter(Plot.id == id).first()
    if not plot:
        raise HTTPException(status_code=404, detail="Plot not found")
        
    if current_user.role not in ['admin', 'owner'] or (current_user.role == 'owner' and plot.owner_id != current_user.id):
        if current_user.role != 'admin':
            raise HTTPException(status_code=403, detail="Not authorized to delete this plot")

    db.delete(plot)
    db.commit()
    return {"message": "Plot deleted successfully"}
