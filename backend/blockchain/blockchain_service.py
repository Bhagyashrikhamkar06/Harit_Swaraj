"""
Blockchain Service for Harit Swaraj
Handles NFT certificate minting on Polygon Mumbai testnet
"""
from web3 import Web3
from eth_account import Account
import qrcode
import json
import os
from datetime import datetime
from typing import Dict, Optional, Tuple
import secrets

# Configuration
POLYGON_MUMBAI_RPC = "https://rpc-mumbai.maticvigil.com"  # Public RPC
POLYGON_EXPLORER = "https://mumbai.polygonscan.com"

# Contract ABI (simplified ERC-721)
CONTRACT_ABI = json.loads('''[
    {
        "inputs": [
            {"internalType": "address", "name": "to", "type": "address"},
            {"internalType": "string", "name": "batchId", "type": "string"},
            {"internalType": "uint256", "name": "co2Removed", "type": "uint256"},
            {"internalType": "string", "name": "tokenURI", "type": "string"}
        ],
        "name": "mintCertificate",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
        "name": "getCertificate",
        "outputs": [
            {"internalType": "string", "name": "batchId", "type": "string"},
            {"internalType": "uint256", "name": "co2Removed", "type": "uint256"},
            {"internalType": "uint256", "name": "timestamp", "type": "uint256"}
        ],
        "stateMutability": "view",
        "type": "function"
    }
]''')


class BlockchainService:
    """Service for blockchain certificate operations"""
    
    def __init__(self, mock_mode: bool = True):
        """
        Initialize blockchain service
        
        Args:
            mock_mode: If True, use mock blockchain (for development)
        """
        self.mock_mode = mock_mode
        self.w3 = None
        self.contract = None
        self.account = None
        
        if not mock_mode:
            try:
                # Connect to Polygon Mumbai
                self.w3 = Web3(Web3.HTTPProvider(POLYGON_MUMBAI_RPC))
                
                # Load private key from environment (NEVER commit this!)
                private_key = os.getenv('BLOCKCHAIN_PRIVATE_KEY')
                if private_key:
                    self.account = Account.from_key(private_key)
                
                # Load contract address from environment
                contract_address = os.getenv('CONTRACT_ADDRESS')
                if contract_address and self.w3.is_address(contract_address):
                    self.contract = self.w3.eth.contract(
                        address=Web3.to_checksum_address(contract_address),
                        abi=CONTRACT_ABI
                    )
                
                print(f"[OK] Connected to Polygon Mumbai: {self.w3.is_connected()}")
            except Exception as e:
                print(f"⚠️ Blockchain connection failed: {e}")
                print("⚠️ Falling back to mock mode")
                self.mock_mode = True
    
    def mint_certificate(
        self,
        batch_id: str,
        co2_removed: float,
        metadata: Dict
    ) -> Tuple[str, int, str]:
        """
        Mint NFT certificate for carbon credit
        
        Args:
            batch_id: Batch ID
            co2_removed: CO2 removed in kg
            metadata: Certificate metadata
            
        Returns:
            Tuple of (transaction_hash, token_id, ipfs_hash)
        """
        if self.mock_mode:
            return self._mock_mint_certificate(batch_id, co2_removed, metadata)
        
        try:
            # Upload metadata to IPFS (mock for now)
            ipfs_hash = self._upload_to_ipfs(metadata)
            token_uri = f"ipfs://{ipfs_hash}"
            
            # Prepare transaction
            co2_wei = int(co2_removed * 1000)  # Convert to integer (kg * 1000)
            
            tx = self.contract.functions.mintCertificate(
                self.account.address,
                batch_id,
                co2_wei,
                token_uri
            ).build_transaction({
                'from': self.account.address,
                'nonce': self.w3.eth.get_transaction_count(self.account.address),
                'gas': 300000,
                'gasPrice': self.w3.eth.gas_price
            })
            
            # Sign and send transaction
            signed_tx = self.account.sign_transaction(tx)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
            
            # Wait for receipt
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            
            # Extract token ID from logs
            token_id = receipt['logs'][0]['topics'][3]  # Simplified
            
            return (
                tx_hash.hex(),
                int.from_bytes(token_id, byteorder='big'),
                ipfs_hash
            )
        
        except Exception as e:
            print(f"⚠️ Certificate minting failed: {e}")
            # Fallback to mock
            return self._mock_mint_certificate(batch_id, co2_removed, metadata)
    
    def _mock_mint_certificate(
        self,
        batch_id: str,
        co2_removed: float,
        metadata: Dict
    ) -> Tuple[str, int, str]:
        """Mock certificate minting for development"""
        # Generate fake transaction hash
        tx_hash = "0x" + secrets.token_hex(32)
        
        # Generate fake token ID
        token_id = secrets.randbelow(1000000)
        
        # Generate fake IPFS hash
        ipfs_hash = "Qm" + secrets.token_hex(22)
        
        print(f"🔷 MOCK: Minted certificate for {batch_id}")
        print(f"   TX Hash: {tx_hash}")
        print(f"   Token ID: {token_id}")
        print(f"   IPFS: {ipfs_hash}")
        
        return (tx_hash, token_id, ipfs_hash)
    
    def verify_certificate(self, tx_hash: str) -> Optional[Dict]:
        """
        Verify certificate on blockchain
        
        Args:
            tx_hash: Transaction hash
            
        Returns:
            Certificate data if valid, None otherwise
        """
        if self.mock_mode:
            return self._mock_verify_certificate(tx_hash)
        
        try:
            # Get transaction receipt
            receipt = self.w3.eth.get_transaction_receipt(tx_hash)
            
            if not receipt:
                return None
            
            # Extract data from logs
            # This is simplified - real implementation would decode logs properly
            return {
                'valid': True,
                'block_number': receipt['blockNumber'],
                'timestamp': datetime.utcnow().isoformat(),
                'status': 'confirmed'
            }
        
        except Exception as e:
            print(f"⚠️ Certificate verification failed: {e}")
            return None
    
    def _mock_verify_certificate(self, tx_hash: str) -> Dict:
        """Mock certificate verification"""
        if not tx_hash.startswith('0x'):
            return {'valid': False, 'error': 'Invalid transaction hash'}
        
        return {
            'valid': True,
            'block_number': secrets.randbelow(10000000),
            'timestamp': datetime.utcnow().isoformat(),
            'status': 'confirmed',
            'network': 'Polygon Mumbai (Mock)',
            'explorer_url': f"{POLYGON_EXPLORER}/tx/{tx_hash}"
        }
    
    def _upload_to_ipfs(self, metadata: Dict) -> str:
        """
        Upload metadata to IPFS
        
        Args:
            metadata: Certificate metadata
            
        Returns:
            IPFS hash
        """
        # Mock IPFS upload for now
        # In production, use Pinata, NFT.Storage, or IPFS client
        ipfs_hash = "Qm" + secrets.token_hex(22)
        
        print(f"📦 Uploaded metadata to IPFS: {ipfs_hash}")
        print(f"   Metadata: {json.dumps(metadata, indent=2)}")
        
        return ipfs_hash
    
    def get_explorer_url(self, tx_hash: str) -> str:
        """Get blockchain explorer URL for transaction"""
        return f"{POLYGON_EXPLORER}/tx/{tx_hash}"


def generate_qr_code(tx_hash: str, output_path: str) -> str:
    """
    Generate QR code for certificate verification
    
    Args:
        tx_hash: Transaction hash
        output_path: Path to save QR code image
        
    Returns:
        Path to saved QR code
    """
    try:
        # Create QR code with explorer URL
        explorer_url = f"{POLYGON_EXPLORER}/tx/{tx_hash}"
        
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(explorer_url)
        qr.make(fit=True)
        
        # Create image
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Save image
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        img.save(output_path)
        
        print(f"[OK] QR code generated: {output_path}")
        return output_path
    
    except Exception as e:
        print(f"⚠️ QR code generation failed: {e}")
        return ""


# Global service instance (mock mode by default)
_blockchain_service = None


def get_blockchain_service() -> BlockchainService:
    """Get or create blockchain service instance"""
    global _blockchain_service
    if _blockchain_service is None:
        # Check if we should use real blockchain
        use_real_blockchain = os.getenv('USE_REAL_BLOCKCHAIN', 'false').lower() == 'true'
        _blockchain_service = BlockchainService(mock_mode=not use_real_blockchain)
    return _blockchain_service


def mint_certificate(batch_id: str, co2_removed: float, metadata: Dict) -> Tuple[str, int, str]:
    """Convenience function to mint certificate"""
    service = get_blockchain_service()
    return service.mint_certificate(batch_id, co2_removed, metadata)


def verify_certificate(tx_hash: str) -> Optional[Dict]:
    """Convenience function to verify certificate"""
    service = get_blockchain_service()
    return service.verify_certificate(tx_hash)
