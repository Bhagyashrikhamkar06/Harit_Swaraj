from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import List, Optional

# --- User & Auth ---
class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: str  # 'owner', 'farmer', 'auditor', 'admin'
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    full_name: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

class PlotUpdate(BaseModel):
    type: Optional[str] = None
    species: Optional[str] = None
    area: Optional[float] = None
    expected_biomass: Optional[float] = None
    status: Optional[str] = None

class PlotPhotoResponse(BaseModel):
    id: int
    photo_path: str
    photo_index: int
    has_gps: int
    gps_latitude: Optional[float] = None
    gps_longitude: Optional[float] = None
    photo_timestamp: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# --- Plot ---
class PlotResponse(BaseModel):
    id: int
    plot_id: str
    owner_id: int
    type: str
    species: str
    area: float
    expected_biomass: float
    status: str
    verification_data: Optional[dict] = None
    created_at: datetime
    photo_count: Optional[int] = 0
    photos: List[PlotPhotoResponse] = []

    class Config:
        from_attributes = True

# --- Harvest ---
class HarvestBase(BaseModel):
    biomass_batch_id: str
    plot_id: int
    actual_harvested_ton: float

class HarvestCreate(HarvestBase):
    pass

class HarvestUpdate(BaseModel):
    actual_harvested_ton: Optional[float] = None

class HarvestResponse(HarvestBase):
    id: int
    user_id: int
    photo_path_1: Optional[str]
    photo_path_2: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

# --- Preprocessing ---
class PreprocessingCreate(BaseModel):
    harvest_id: int
    method: str

class PreprocessingResponse(PreprocessingCreate):
    id: int
    photo_before_path: Optional[str]
    photo_after_path: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# --- Transport ---
class TransportBase(BaseModel):
    shipment_id: str
    type: str # 'inbound', 'outbound'
    vehicle_type: Optional[str] = None
    vehicle_number: Optional[str] = None
    mileage: Optional[float] = None
    route_from: Optional[str] = None
    route_to: Optional[str] = None
    harvest_id: Optional[int] = None
    distribution_id: Optional[int] = None
    quantity_kg: Optional[float] = None

class TransportCreate(TransportBase):
    pass

class TransportUpdate(BaseModel):
    vehicle_type: Optional[str] = None
    vehicle_number: Optional[str] = None
    mileage: Optional[float] = None
    route_from: Optional[str] = None
    route_to: Optional[str] = None
    quantity_kg: Optional[float] = None

class TransportResponse(TransportBase):
    id: int
    loading_photo_path: Optional[str]
    unloading_photo_path: Optional[str]
    date: datetime

    class Config:
        from_attributes = True

# --- Manufacturing ---
class BatchBase(BaseModel):
    batch_id: str
    biomass_input: float
    biochar_output: float
    kiln_type: str
    species: Optional[str] = None

class BatchCreate(BatchBase):
    pass

class BatchUpdate(BaseModel):
    biomass_input: Optional[float] = None
    biochar_output: Optional[float] = None
    kiln_type: Optional[str] = None
    species: Optional[str] = None
    status: Optional[str] = None

class BatchResponse(BatchBase):
    id: int
    ratio: float
    co2_removed: float
    status: str
    rule_status: str
    ml_prediction: Optional[dict] = None
    video_path: Optional[str] = None
    photo_path: Optional[str] = None
    created_at: datetime
    blockchain_tx_hash: Optional[str] = None
    certificate_token_id: Optional[int] = None
    blockchain_status: Optional[str] = None
    qr_code_path: Optional[str] = None
    user_id: int

    class Config:
        from_attributes = True

# --- Unburnable Process ---
class UnburnableMethodCreate(BaseModel):
    batch_id: int
    method: str
    biochar_weight: float
    clay_weight: float

class UnburnableMethodResponse(UnburnableMethodCreate):
    id: int
    photo_path: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

# --- Distribution ---
class DistributionBase(BaseModel):
    batch_id: int
    customer_id: Optional[str]
    planned_use: Optional[str]
    location: Optional[str]
    quantity_kg: float
    amount_rs: Optional[float]

class DistributionCreate(DistributionBase):
    pass

class DistributionUpdate(BaseModel):
    customer_id: Optional[str] = None
    planned_use: Optional[str] = None
    location: Optional[str] = None
    quantity_kg: Optional[float] = None
    amount_rs: Optional[float] = None

class DistributionResponse(DistributionBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# --- Application ---
class ApplicationCreate(BaseModel):
    purpose: str

class ApplicationResponse(ApplicationCreate):
    id: int
    photo_path: Optional[str]
    kml_file_path: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# --- Audit ---
class AuditBase(BaseModel):
    type: str # 'field', 'manufacturing', 'application'
    plot_id: Optional[int] = None
    
    # Field
    satellite_land_use: Optional[str] = None
    observed_land_use: Optional[str] = None
    
    # Manufacturing
    facility_location_check: Optional[bool] = None
    inbound_biomass_data: Optional[list] = None
    actual_biomass_data: Optional[list] = None
    biochar_production_data: Optional[list] = None
    
    # Application
    application_plot_id: Optional[str] = None
    biochar_presence_verified: Optional[bool] = None
    predicted_quantity_per_ha: Optional[float] = None
    photo_ids: Optional[list] = None # Or similar structure

class AuditCreate(AuditBase):
    pass

class AuditResponse(AuditBase):
    id: int
    auditor_id: int
    date: datetime
    photos: Optional[list] = None
    
    class Config:
        from_attributes = True
