"""
Database models for Harit Swaraj MRV System
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON
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
    plots = relationship("Plot", back_populates="farmer")
    batches = relationship("ManufacturingBatch", back_populates="user")
    applications = relationship("Application", back_populates="farmer")

class Plot(Base):
    __tablename__ = "plots"
    
    id = Column(Integer, primary_key=True, index=True)
    plot_id = Column(String(50), unique=True, nullable=False, index=True)
    farmer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(String(50), nullable=False)  # 'Wood', 'Agricultural Waste'
    species = Column(String(50), nullable=False)
    area = Column(Float, nullable=False)  # in acres
    expected_biomass = Column(Float, nullable=False)  # in tons
    status = Column(String(20), nullable=False, default='pending')  # 'pending', 'verified', 'suspicious', 'locked'
    kml_file_path = Column(String(255))
    verification_data = Column(JSON)  # Store ML verification results
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    farmer = relationship("User", back_populates="plots")
    photos = relationship("PlotPhoto", back_populates="plot", cascade="all, delete-orphan")

class PlotPhoto(Base):
    __tablename__ = "plot_photos"
    
    id = Column(Integer, primary_key=True, index=True)
    plot_id = Column(Integer, ForeignKey("plots.id"), nullable=False)
    photo_path = Column(String(255), nullable=False)
    photo_index = Column(Integer, nullable=False)  # 0-3 for the 4 required photos
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    plot = relationship("Plot", back_populates="photos")

class ManufacturingBatch(Base):
    __tablename__ = "manufacturing_batches"
    
    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(String(50), unique=True, nullable=False, index=True)
    biomass_input = Column(Float, nullable=False)
    biochar_output = Column(Float, nullable=False)
    ratio = Column(Float, nullable=False)
    co2_removed = Column(Float, nullable=False)
    kiln_type = Column(String(50), nullable=False)
    species = Column(String(50))
    status = Column(String(20), nullable=False)  # 'verified', 'flagged', 'pending'
    rule_status = Column(String(20), nullable=False)
    ml_prediction = Column(JSON)  # Store ML prediction results
    video_path = Column(String(255))
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="batches")

class Application(Base):
    __tablename__ = "applications"
    
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(String(50), unique=True, nullable=False, index=True)
    batch_id = Column(Integer, ForeignKey("manufacturing_batches.id"), nullable=False)
    farmer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    purpose = Column(String(100), nullable=False)
    status = Column(String(20), nullable=False, default='pending_audit')  # 'pending_audit', 'approved', 'rejected'
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    farmer = relationship("User", back_populates="applications")
