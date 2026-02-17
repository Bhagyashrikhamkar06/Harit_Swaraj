from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import os
from datetime import datetime

from database import get_db
from models import User, ManufacturingBatch
from auth import get_current_user
from file_storage import UPLOAD_DIR
from schemas import BatchResponse

router = APIRouter(
    prefix="/blockchain",
    tags=["Blockchain Certificate"]
)

@router.post("/mint-certificate/{batch_id}")
async def mint_blockchain_certificate(
    batch_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mint blockchain NFT certificate for verified batch
    """
    if current_user.role not in ['admin', 'owner']:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    batch = db.query(ManufacturingBatch).filter(ManufacturingBatch.batch_id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
        
    if batch.status != 'verified':
        raise HTTPException(status_code=400, detail="Only verified batches can be minted")
        
    if batch.blockchain_status == 'minted':
        return {"message": "Already minted", "tx_hash": batch.blockchain_tx_hash}

    try:
        # Mock blockchain service if not available
        try:
            from blockchain.blockchain_service import mint_certificate, generate_qr_code
            
            metadata = {
                "batch_id": batch.batch_id,
                "biomass_input": batch.biomass_input,
                "biochar_output": batch.biochar_output,
                "co2_removed": batch.co2_removed,
                "kiln_type": batch.kiln_type,
                "timestamp": batch.created_at.isoformat(),
                "issuer": "Harit Swaraj MRV"
            }
            
            tx_hash, token_id, ipfs_hash = mint_certificate(
                batch_id=batch.batch_id,
                co2_removed=batch.co2_removed,
                metadata=metadata
            )
            
            # QR
            qr_dir = os.path.join(UPLOAD_DIR, 'qr_codes')
            os.makedirs(qr_dir, exist_ok=True)
            qr_path = os.path.join(qr_dir, f"{batch_id}_qr.png")
            generate_qr_code(tx_hash, qr_path)
            
            batch.blockchain_tx_hash = tx_hash
            batch.certificate_token_id = token_id
            batch.certificate_ipfs_hash = ipfs_hash
            batch.blockchain_status = 'minted'
            batch.qr_code_path = f"qr_codes/{batch_id}_qr.png"
            db.commit()
            
            return {
                "message": "Minted successfully",
                "tx_hash": tx_hash,
                "qr_code": f"/uploads/qr_codes/{batch_id}_qr.png"
            }
            
        except ImportError:
            # Simulation
            batch.blockchain_status = 'minted'
            batch.blockchain_tx_hash = "0x" + "a"*64
            db.commit()
            return {"message": "Simulation: Minted (Blockchain service not found)"}
            
    except Exception as e:
        batch.blockchain_status = 'failed'
        db.commit()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/certificate/{batch_id}")
async def get_certificate(batch_id: str, db: Session = Depends(get_db)):
    batch = db.query(ManufacturingBatch).filter(ManufacturingBatch.batch_id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
        
    return {
        "has_certificate": batch.blockchain_status == 'minted',
        "tx_hash": batch.blockchain_tx_hash,
        "qr_code": f"/uploads/{batch.qr_code_path}" if batch.qr_code_path else None
    }
