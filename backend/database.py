"""
Database configuration and session management for Harit Swaraj
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Database file path
DB_DIR = os.path.join(os.path.dirname(__file__), 'data')
os.makedirs(DB_DIR, exist_ok=True)

# Check for DATABASE_URL environment variable (from Render/Railway/AWS)
# If not found, fall back to local SQLite
env_db_url = os.getenv("DATABASE_URL")

if env_db_url and env_db_url.startswith("postgres"):
    # SQLAlchemy requires postgresql:// not postgres:// (fix for some cloud providers)
    DATABASE_URL = env_db_url.replace("postgres://", "postgresql://")
    connect_args = {}
else:
    # Local SQLite
    DATABASE_URL = f"sqlite:///{os.path.join(DB_DIR, 'harit_swaraj.db')}"
    connect_args = {"check_same_thread": False}

# Create engine
engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=False  # Set to True for SQL query logging
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# Dependency to get DB session
def get_db():
    """
    Dependency function to get database session.
    Use with FastAPI Depends.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """
    Initialize database - create all tables
    """
    from models import (User, Plot, PlotPhoto, BiomassHarvest, Transport, 
                        BiomassPreprocessing, ManufacturingBatch, Distribution, 
                        UnburnableProcess, BiocharApplication, Audit)
    Base.metadata.create_all(bind=engine)
    print("[OK] Database initialized successfully")
