"""
Database models for Harit Swaraj MRV System
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)  # 'owner', 'farmer', 'auditor', 'admin'
    full_name = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    plots = relationship("Plot", back_populates="owner")
    harvests = relationship("BiomassHarvest", back_populates="user")
    batches = relationship("ManufacturingBatch", back_populates="user")
    audits = relationship("Audit", back_populates="auditor")

class Plot(Base):
    __tablename__ = "plots"
    
    id = Column(Integer, primary_key=True, index=True)
    plot_id = Column(String(50), unique=True, nullable=False, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(String(50), nullable=False)  # 'Wood', 'Agricultural Waste'
    species = Column(String(50), nullable=False)
    area = Column(Float, nullable=False)  # in acres
    expected_biomass = Column(Float, nullable=False)  # in tons
    status = Column(String(20), nullable=False, default='pending')
    kml_file_path = Column(String(255))
    verification_data = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    owner = relationship("User", back_populates="plots")
    photos = relationship("PlotPhoto", back_populates="plot", cascade="all, delete-orphan")
    harvests = relationship("BiomassHarvest", back_populates="plot")
    audits = relationship("Audit", back_populates="plot")

class PlotPhoto(Base):
    __tablename__ = "plot_photos"
    
    id = Column(Integer, primary_key=True, index=True)
    plot_id = Column(Integer, ForeignKey("plots.id"), nullable=False)
    photo_path = Column(String(255), nullable=False)
    photo_index = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # CV Fields
    cv_analysis = Column(JSON)
    quality_score = Column(Float)
    has_gps = Column(Integer, default=0)
    gps_latitude = Column(Float)
    gps_longitude = Column(Float)
    photo_timestamp = Column(DateTime)
    perceptual_hash = Column(String(64))
    
    plot = relationship("Plot", back_populates="photos")

class BiomassHarvest(Base):
    __tablename__ = "biomass_harvests"
    
    id = Column(Integer, primary_key=True, index=True)
    biomass_batch_id = Column(String(50), unique=True, nullable=False, index=True)
    plot_id = Column(Integer, ForeignKey("plots.id"), nullable=False)
    actual_harvested_ton = Column(Float, nullable=False)
    photo_path_1 = Column(String(255)) # Side 1
    photo_path_2 = Column(String(255)) # Side 2
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    plot = relationship("Plot", back_populates="harvests")
    user = relationship("User", back_populates="harvests")
    transports = relationship("Transport", back_populates="harvest")
    preprocessing = relationship("BiomassPreprocessing", back_populates="harvest")

class Transport(Base):
    __tablename__ = "transports"
    
    id = Column(Integer, primary_key=True, index=True)
    shipment_id = Column(String(50), unique=True, nullable=False, index=True)
    type = Column(String(20), nullable=False) # 'inbound' or 'outbound'
    
    # Common Fields
    date = Column(DateTime, default=datetime.utcnow)
    loading_photo_path = Column(String(255))
    unloading_photo_path = Column(String(255))
    
    # Inbound specific (linked to Harvest)
    harvest_id = Column(Integer, ForeignKey("biomass_harvests.id"), nullable=True)
    vehicle_type = Column(String(50))
    vehicle_number = Column(String(20))
    mileage = Column(Float)
    route_from = Column(String(100))
    route_to = Column(String(100))
    
    # Outbound specific (linked to Distribution)
    distribution_id = Column(Integer, ForeignKey("distributions.id"), nullable=True)
    quantity_kg = Column(Float)
    
    # Relationships
    harvest = relationship("BiomassHarvest", back_populates="transports")
    distribution = relationship("Distribution", back_populates="transports")

class BiomassPreprocessing(Base):
    __tablename__ = "biomass_preprocessing"
    
    id = Column(Integer, primary_key=True, index=True)
    harvest_id = Column(Integer, ForeignKey("biomass_harvests.id"), nullable=False)
    method = Column(String(100))
    photo_before_path = Column(String(255))
    photo_after_path = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    harvest = relationship("BiomassHarvest", back_populates="preprocessing")

class ManufacturingBatch(Base):
    __tablename__ = "manufacturing_batches"
    
    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(String(50), unique=True, nullable=False, index=True)
    
    # Link to biomass source (could be multiple, but simplifying)
    biomass_input = Column(Float, nullable=False)
    
    biochar_output = Column(Float, nullable=False)
    ratio = Column(Float, nullable=False)
    co2_removed = Column(Float, nullable=False)
    kiln_type = Column(String(50), nullable=False)
    species = Column(String(50))
    
    status = Column(String(20), nullable=False)
    rule_status = Column(String(20), nullable=False)
    ml_prediction = Column(JSON)
    video_path = Column(String(255))
    photo_path = Column(String(255))
    
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    blockchain_tx_hash = Column(String(100))
    certificate_token_id = Column(Integer)
    certificate_ipfs_hash = Column(String(100))
    blockchain_status = Column(String(20), default='pending')
    qr_code_path = Column(String(255))
    
    user = relationship("User", back_populates="batches")
    distributions = relationship("Distribution", back_populates="batch")
    unburnable_process = relationship("UnburnableProcess", back_populates="batch", uselist=False)

class Distribution(Base):
    __tablename__ = "distributions"
    
    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("manufacturing_batches.id"), nullable=False)
    customer_id = Column(String(50))
    planned_use = Column(String(50))
    location = Column(String(100))
    quantity_kg = Column(Float, nullable=False)
    amount_rs = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    batch = relationship("ManufacturingBatch", back_populates="distributions")
    transports = relationship("Transport", back_populates="distribution")
    applications = relationship("BiocharApplication", back_populates="distribution")

class UnburnableProcess(Base):
    __tablename__ = "unburnable_processes"
    
    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("manufacturing_batches.id"), nullable=False)
    method = Column(String(100))
    biochar_weight = Column(Float)
    clay_weight = Column(Float)
    photo_path = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    batch = relationship("ManufacturingBatch", back_populates="unburnable_process")

class BiocharApplication(Base):
    __tablename__ = "biochar_applications"
    
    id = Column(Integer, primary_key=True, index=True)
    distribution_id = Column(Integer, ForeignKey("distributions.id"), nullable=False)
    purpose = Column(String(50))
    photo_path = Column(String(255))
    kml_file_path = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    distribution = relationship("Distribution", back_populates="applications")

class Audit(Base):
    __tablename__ = "audits"
    
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String(20), nullable=False)
    auditor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(DateTime, default=datetime.utcnow)
    
    plot_id = Column(Integer, ForeignKey("plots.id"), nullable=True)
    satellite_land_use = Column(String(50))
    observed_land_use = Column(String(50))
    
    facility_location_check = Column(Boolean)
    inbound_biomass_data = Column(JSON)
    actual_biomass_data = Column(JSON)
    biochar_production_data = Column(JSON)
    
    application_plot_id = Column(String(50))
    biochar_presence_verified = Column(Boolean)
    predicted_quantity_per_ha = Column(Float)
    photos = Column(JSON)
    
    auditor = relationship("User", back_populates="audits")
    plot = relationship("Plot", back_populates="audits")
