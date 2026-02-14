"""
Harit Swaraj MRV System - Main API
Production-ready FastAPI application with authentication, database, and ML integration
"""
from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session
import json

# Local imports
from database import get_db, init_db
from models import User, Plot, PlotPhoto, ManufacturingBatch, Application
from auth import (
    hash_password, authenticate_user, create_access_token,
    get_current_user, require_role
)
from file_storage import save_photo, save_video, save_kml, get_file_path, UPLOAD_DIR
# try:
#     from ml.manufacturing_anomaly import get_anomaly_detector
#     from ml.plot_verification import get_plot_verifier
# except ImportError as e:
#     print(f"⚠️ ML libraries not found ({e}). Using mock models.")
from ml.mock_ml import get_anomaly_detector, get_plot_verifier

# Initialize FastAPI app
app = FastAPI(
    title="Harit Swaraj MRV API",
    description="Production-ready API for biochar carbon credit verification",
    version="1.0.0"
)

# CORS middleware - Allow frontend to connect
import os

# Get allowed origins from environment variable or use defaults
ALLOWED_ORIGINS = os.getenv("CORS_ORIGINS", "").split(",") if os.getenv("CORS_ORIGINS") else [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://0.0.0.0:3000",
]

# In production, add your deployed frontend URL
# Example: CORS_ORIGINS=https://harit-swaraj.vercel.app,https://harit-swaraj.netlify.app

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Initialize ML models at startup
anomaly_detector = get_anomaly_detector()
plot_verifier = get_plot_verifier()

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
        # Don't crash the app
    finally:
        db.close()

# Mount static files for serving uploads
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# ============ PYDANTIC MODELS ============

class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: str  # 'owner', 'farmer', 'auditor'
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class PlotResponse(BaseModel):
    id: int
    plot_id: str
    farmer_id: int
    type: str
    species: str
    area: float
    expected_biomass: float
    status: str
    verification_data: Optional[dict] = None
    created_at: datetime
    photo_count: int

class BatchResponse(BaseModel):
    id: int
    batch_id: str
    biomass_input: float
    biochar_output: float
    ratio: float
    co2_removed: float
    kiln_type: str
    status: str
    ml_prediction: Optional[dict] = None
    created_at: datetime

# ============ AUTHENTICATION ENDPOINTS ============

@app.post("/auth/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """
    Register a new user
    """
    # Check if username exists
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Check if email exists
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Validate role
    valid_roles = ['owner', 'farmer', 'auditor', 'admin']
    if user_data.role not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}"
        )
    
    # Create new user
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
    
    # Create access token
    access_token = create_access_token(data={"sub": new_user.username})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
            "role": new_user.role,
            "full_name": new_user.full_name
        }
    }

@app.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Login and get access token
    """
    user = authenticate_user(db, credentials.username, credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": user.username})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "full_name": user.full_name
        }
    }

@app.get("/auth/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Get current user information
    """
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.role,
        "full_name": current_user.full_name,
        "created_at": current_user.created_at
    }

# ============ PLOT ENDPOINTS ============

@app.post("/biomass/register-plot", status_code=status.HTTP_201_CREATED)
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
    Register a new biomass plot with photos and KML file
    Requires: farmer or owner role
    """
    # Check role
    if current_user.role not in ['farmer', 'owner']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only farmers and owners can register plots"
        )
    
    # Check if plot_id already exists
    existing_plot = db.query(Plot).filter(Plot.plot_id == plot_id).first()
    if existing_plot:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Plot ID {plot_id} already exists"
        )
    
    # Save KML file and run verification
    kml_path = await save_kml(kml_file, plot_id)
    
    # Reset cursor position before reading again
    await kml_file.seek(0)
    
    # Read KML content for verification
    kml_content = await kml_file.read()
    kml_string = kml_content.decode('utf-8')
    
    # Run ML verification
    verification_result = plot_verifier.verify_plot(kml_string, str(current_user.id), plot_id)
    
    # Determine initial status based on verification
    initial_status = "verified" if verification_result.get("plot_status") == "verified" else "suspicious"
    
    # Create plot record
    new_plot = Plot(
        plot_id=plot_id,
        farmer_id=current_user.id,
        type=type,
        species=species,
        area=area,
        expected_biomass=expected_biomass,
        status=initial_status,
        kml_file_path=kml_path,
        verification_data=verification_result
    )
    
    db.add(new_plot)
    db.commit()
    db.refresh(new_plot)
    
    # Save photos with CV analysis
    photos = [photo_0, photo_1, photo_2, photo_3]
    existing_hashes = []  # For duplicate detection
    
    for idx, photo in enumerate(photos):
        photo_path = await save_photo(photo, plot_id, idx)
        
        # Run CV analysis
        try:
            from cv.cv_analyzer import analyze_photo
            full_path = get_file_path(photo_path)
            cv_result = analyze_photo(full_path, existing_hashes)
            
            # Add hash to existing list for next photo
            if cv_result.get('perceptual_hash'):
                existing_hashes.append(cv_result['perceptual_hash'])
            
            # Parse timestamp if present
            photo_ts = None
            if cv_result.get('timestamp'):
                try:
                    from datetime import datetime
                    if isinstance(cv_result['timestamp'], str):
                        photo_ts = datetime.fromisoformat(cv_result['timestamp'].replace('Z', '+00:00'))
                except:
                    pass
            
            plot_photo = PlotPhoto(
                plot_id=new_plot.id,
                photo_path=photo_path,
                photo_index=idx,
                cv_analysis=cv_result,
                quality_score=cv_result.get('quality_score', 0.0),
                has_gps=1 if cv_result.get('has_gps') else 0,
                gps_latitude=cv_result.get('gps_coordinates', [None, None])[0],
                gps_longitude=cv_result.get('gps_coordinates', [None, None])[1],
                photo_timestamp=photo_ts,
                perceptual_hash=cv_result.get('perceptual_hash')
            )
            
            # Flag plot if quality is too low or duplicate found
            if cv_result.get('quality_score', 1.0) < 0.5:
                new_plot.status = 'suspicious'
            if cv_result.get('is_duplicate'):
                new_plot.status = 'suspicious'
                
        except Exception as e:
            print(f"⚠️ CV analysis failed for photo {idx}: {e}")
            # Still save photo without CV analysis
            plot_photo = PlotPhoto(
                plot_id=new_plot.id,
                photo_path=photo_path,
                photo_index=idx
            )
        
        db.add(plot_photo)
    
    db.commit()
    
    return {
        "message": "Plot registered successfully",
        "plot_id": plot_id,
        "status": initial_status,
        "verification": verification_result
    }

@app.get("/biomass/plots", response_model=List[PlotResponse])
async def get_plots(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get plots (filtered by user role)
    - Farmers see only their plots
    - Owners/Auditors/Admins see all plots
    """
    query = db.query(Plot)
    
    # Filter by user role
    if current_user.role == 'farmer':
        query = query.filter(Plot.farmer_id == current_user.id)
    
    # Filter by status if provided
    if status:
        query = query.filter(Plot.status == status)
    
    plots = query.order_by(Plot.created_at.desc()).all()
    
    # Add photo count to response
    result = []
    for plot in plots:
        photo_count = db.query(PlotPhoto).filter(PlotPhoto.plot_id == plot.id).count()
        result.append(PlotResponse(
            id=plot.id,
            plot_id=plot.plot_id,
            farmer_id=plot.farmer_id,
            type=plot.type,
            species=plot.species,
            area=plot.area,
            expected_biomass=plot.expected_biomass,
            status=plot.status,
            verification_data=plot.verification_data,
            created_at=plot.created_at,
            photo_count=photo_count
        ))
    
    return result

@app.get("/biomass/plots/{plot_id}")
async def get_plot_details(
    plot_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed plot information including photos
    """
    plot = db.query(Plot).filter(Plot.plot_id == plot_id).first()
    
    if not plot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Plot {plot_id} not found"
        )
    
    # Check access permissions
    if current_user.role == 'farmer' and plot.farmer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Get photos
    photos = db.query(PlotPhoto).filter(PlotPhoto.plot_id == plot.id).order_by(PlotPhoto.photo_index).all()
    
    return {
        "plot_id": plot.plot_id,
        "type": plot.type,
        "species": plot.species,
        "area": plot.area,
        "expected_biomass": plot.expected_biomass,
        "status": plot.status,
        "kml_file": f"/uploads/{plot.kml_file_path}" if plot.kml_file_path else None,
        "verification_data": plot.verification_data,
        "created_at": plot.created_at,
        "photos": [f"/uploads/{photo.photo_path}" for photo in photos]
    }

# ============ MANUFACTURING ENDPOINTS ============

@app.post("/manufacturing/record", status_code=status.HTTP_201_CREATED)
async def create_manufacturing_batch(
    batch_id: str = Form(...),
    biomass_input: float = Form(...),
    biochar_output: float = Form(...),
    kiln_type: str = Form(...),
    species: Optional[str] = Form(None),
    video: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Record a new biochar manufacturing batch
    Requires: owner role
    """
    # Check role
    if current_user.role not in ['owner', 'admin']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners can record manufacturing batches"
        )
    
    # Check if batch_id already exists
    existing_batch = db.query(ManufacturingBatch).filter(ManufacturingBatch.batch_id == batch_id).first()
    if existing_batch:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Batch ID {batch_id} already exists"
        )
    
    # Calculate ratio and CO2
    ratio = biochar_output / biomass_input
    co2_removed = biochar_output * 0.8 * (44 / 12)
    
    # Rule-based validation
    rule_status = "verified" if 0.20 <= ratio <= 0.30 else "flagged"
    
    # ML-based anomaly detection
    try:
        ml_prediction = anomaly_detector.predict(
            biomass_input=biomass_input,
            biochar_output=biochar_output,
            kiln_type=kiln_type
        )
    except Exception as e:
        print(f"⚠️ ML prediction error: {e}")
        ml_prediction = {
            "ml_status": "error",
            "confidence_score": 0.0,
            "anomaly_score": 0.0,
            "conversion_ratio": ratio,
            "reason": "ML service temporarily unavailable",
            "timestamp": datetime.utcnow().isoformat()
        }
    
    # Final status
    final_status = "flagged" if (rule_status == "flagged" or ml_prediction.get("ml_status") == "flagged") else "verified"
    
    # Save video if provided
    video_path = None
    if video:
        video_path = await save_video(video, batch_id)
    
    # Create batch record
    new_batch = ManufacturingBatch(
        batch_id=batch_id,
        biomass_input=biomass_input,
        biochar_output=biochar_output,
        ratio=ratio,
        co2_removed=co2_removed,
        kiln_type=kiln_type,
        species=species,
        status=final_status,
        rule_status=rule_status,
        ml_prediction=ml_prediction,
        video_path=video_path,
        user_id=current_user.id
    )
    
    db.add(new_batch)
    db.commit()
    db.refresh(new_batch)
    
    return {
        "message": "Batch recorded successfully",
        "batch_id": batch_id,
        "status": final_status,
        "ratio": round(ratio, 4),
        "co2_removed": round(co2_removed, 2),
        "rule_status": rule_status,
        "ml_prediction": ml_prediction
    }

@app.get("/manufacturing/batches", response_model=List[BatchResponse])
async def get_batches(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get manufacturing batches
    """
    query = db.query(ManufacturingBatch)
    
    # Filter by status if provided
    if status:
        query = query.filter(ManufacturingBatch.status == status)
    
    batches = query.order_by(ManufacturingBatch.created_at.desc()).all()
    
    return [
        BatchResponse(
            id=batch.id,
            batch_id=batch.batch_id,
            biomass_input=batch.biomass_input,
            biochar_output=batch.biochar_output,
            ratio=batch.ratio,
            co2_removed=batch.co2_removed,
            kiln_type=batch.kiln_type,
            status=batch.status,
            ml_prediction=batch.ml_prediction,
            created_at=batch.created_at
        )
        for batch in batches
    ]

@app.get("/manufacturing/batches/{batch_id}")
async def get_batch_details(
    batch_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed batch information
    """
    batch = db.query(ManufacturingBatch).filter(ManufacturingBatch.batch_id == batch_id).first()
    
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Batch {batch_id} not found"
        )
    
    return {
        "batch_id": batch.batch_id,
        "biomass_input": batch.biomass_input,
        "biochar_output": batch.biochar_output,
        "ratio": batch.ratio,
        "co2_removed": batch.co2_removed,
        "kiln_type": batch.kiln_type,
        "species": batch.species,
        "status": batch.status,
        "rule_status": batch.rule_status,
        "ml_prediction": batch.ml_prediction,
        "video": f"/uploads/{batch.video_path}" if batch.video_path else None,
        "created_at": batch.created_at
    }

# ============ DASHBOARD ENDPOINTS ============

@app.get("/dashboard/summary")
async def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get dashboard summary statistics
    """
    # Get batches
    batches_query = db.query(ManufacturingBatch)
    if current_user.role == 'owner':
        batches_query = batches_query.filter(ManufacturingBatch.user_id == current_user.id)
    
    batches = batches_query.all()
    
    total_biochar = sum(b.biochar_output for b in batches)
    total_co2 = sum(b.co2_removed for b in batches)
    verified_batches = len([b for b in batches if b.status == 'verified'])
    flagged_batches = len([b for b in batches if b.status == 'flagged'])
    
    # Get plots
    plots_query = db.query(Plot)
    if current_user.role == 'farmer':
        plots_query = plots_query.filter(Plot.farmer_id == current_user.id)
    
    plots = plots_query.all()
    total_plots = len(plots)
    verified_plots = len([p for p in plots if p.status == 'verified'])
    
    return {
        "total_biochar_kg": round(total_biochar, 2),
        "total_co2_removed_kg": round(total_co2, 2),
        "total_batches": len(batches),
        "verified_batches": verified_batches,
        "flagged_batches": flagged_batches,
        "total_plots": total_plots,
        "verified_plots": verified_plots
    }

# ============ BLOCKCHAIN CERTIFICATE ENDPOINTS ============

@app.post("/blockchain/mint-certificate/{batch_id}")
async def mint_blockchain_certificate(
    batch_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mint blockchain NFT certificate for verified batch
    Requires: admin or owner role
    """
    # Check role
    if current_user.role not in ['admin', 'owner']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins and owners can mint certificates"
        )
    
    # Get batch
    batch = db.query(ManufacturingBatch).filter(ManufacturingBatch.batch_id == batch_id).first()
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Batch {batch_id} not found"
        )
    
    # Check if batch is verified
    if batch.status != 'verified':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only verified batches can receive certificates"
        )
    
    # Check if already minted
    if batch.blockchain_tx_hash:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Certificate already minted for this batch"
        )
    
    try:
        from blockchain.blockchain_service import mint_certificate, generate_qr_code
        
        # Prepare metadata
        metadata = {
            "batch_id": batch.batch_id,
            "biomass_input": batch.biomass_input,
            "biochar_output": batch.biochar_output,
            "co2_removed": batch.co2_removed,
            "kiln_type": batch.kiln_type,
            "timestamp": batch.created_at.isoformat(),
            "issuer": "Harit Swaraj MRV",
            "standard": "Biochar Carbon Removal"
        }
        
        # Mint certificate
        tx_hash, token_id, ipfs_hash = mint_certificate(
            batch_id=batch.batch_id,
            co2_removed=batch.co2_removed,
            metadata=metadata
        )
        
        # Generate QR code
        qr_dir = os.path.join(UPLOAD_DIR, 'qr_codes')
        os.makedirs(qr_dir, exist_ok=True)
        qr_path = os.path.join(qr_dir, f"{batch_id}_qr.png")
        generate_qr_code(tx_hash, qr_path)
        qr_relative_path = f"qr_codes/{batch_id}_qr.png"
        
        # Update batch
        batch.blockchain_tx_hash = tx_hash
        batch.certificate_token_id = token_id
        batch.certificate_ipfs_hash = ipfs_hash
        batch.blockchain_status = 'minted'
        batch.qr_code_path = qr_relative_path
        
        db.commit()
        
        return {
            "message": "Certificate minted successfully",
            "tx_hash": tx_hash,
            "token_id": token_id,
            "ipfs_hash": ipfs_hash,
            "qr_code": f"/uploads/{qr_relative_path}",
            "explorer_url": f"https://mumbai.polygonscan.com/tx/{tx_hash}"
        }
    
    except Exception as e:
        batch.blockchain_status = 'failed'
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Certificate minting failed: {str(e)}"
        )

@app.get("/blockchain/certificate/{batch_id}")
async def get_certificate_details(
    batch_id: str,
    db: Session = Depends(get_db)
):
    """Get certificate details for a batch"""
    batch = db.query(ManufacturingBatch).filter(ManufacturingBatch.batch_id == batch_id).first()
    
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Batch {batch_id} not found"
        )
    
    if not batch.blockchain_tx_hash:
        return {
            "has_certificate": False,
            "blockchain_status": batch.blockchain_status
        }
    
    return {
        "has_certificate": True,
        "batch_id": batch.batch_id,
        "tx_hash": batch.blockchain_tx_hash,
        "token_id": batch.certificate_token_id,
        "ipfs_hash": batch.certificate_ipfs_hash,
        "blockchain_status": batch.blockchain_status,
        "qr_code": f"/uploads/{batch.qr_code_path}" if batch.qr_code_path else None,
        "explorer_url": f"https://mumbai.polygonscan.com/tx/{batch.blockchain_tx_hash}",
        "co2_removed": batch.co2_removed,
        "created_at": batch.created_at
    }

@app.get("/blockchain/verify/{tx_hash}")
async def verify_blockchain_certificate(tx_hash: str):
    """Verify certificate authenticity on blockchain"""
    try:
        from blockchain.blockchain_service import verify_certificate
        
        result = verify_certificate(tx_hash)
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Certificate not found on blockchain"
            )
        
        return result
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Verification failed: {str(e)}"
        )

# ============ ROOT ENDPOINT ============

@app.get("/")
def root():
    return {
        "message": "Harit Swaraj MRV API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
