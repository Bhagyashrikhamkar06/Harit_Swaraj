"""
ML-Based Anomaly Detection for Biochar Manufacturing
======================================================
Uses Isolation Forest to detect abnormal conversion ratios.
Explainable, auditable, MRV-compliant approach.

Why Isolation Forest?
- Detects global outliers and local anomalies
- No need for labeled data
- Fast and efficient
- Works well with small feature sets
- Produces anomaly scores (0-1)

Why Rule-Based + ML Hybrid?
- Rule-based (ratio validation): Catches known violation patterns
- ML-based (anomaly detection): Catches unknown/novel frauds
- Together: Better fraud prevention
"""

import numpy as np
import json
from datetime import datetime
from pathlib import Path
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import pickle


class ManufacturingAnomalyDetector:
    """
    Detects anomalies in biochar manufacturing using Isolation Forest.
    
    Features:
    - biomass_input (kg)
    - biochar_output (kg)
    - conversion_ratio (output/input)
    - kiln_type_encoded (numerical)
    
    Returns:
    - ml_status: "verified" | "flagged"
    - confidence_score: 0-1 (higher = more anomalous)
    - reason: explanation
    """
    
    def __init__(self, model_path: str = None):
        self.model_path = model_path or "backend/ml/models/isolation_forest.pkl"
        self.scaler_path = model_path.replace(".pkl", "_scaler.pkl") if model_path else "backend/ml/models/scaler.pkl"
        self.kiln_encoding = {
            "Batch Retort Kiln": 1,
            "Continuous Retort": 2,
            "TLUD": 3,
            "Rocket Kiln": 4
        }
        
        self.model = None
        self.scaler = None
        self.training_data = []
        self._initialize()
    
    def _initialize(self):
        """Load or create model on startup"""
        try:
            # Try loading existing model
            with open(self.model_path, 'rb') as f:
                self.model = pickle.load(f)
            with open(self.scaler_path, 'rb') as f:
                self.scaler = pickle.load(f)
            print(f"✅ Loaded pre-trained model from {self.model_path}")
        except FileNotFoundError:
            # Create initial model with synthetic training data
            print("⚠️  Model not found. Training with synthetic data...")
            self._train_initial_model()
    
    def _train_initial_model(self):
        """Train initial model with realistic biochar conversion data"""
        # Synthetic training data: realistic biochar manufacturing scenarios
        np.random.seed(42)
        
        data = []
        
        # Normal scenarios (ratio 0.20-0.30)
        for _ in range(500):
            biomass = np.random.uniform(200, 1000)  # 200-1000 kg
            ratio = np.random.uniform(0.20, 0.30)
            biochar = biomass * ratio
            kiln_encoded = np.random.choice([1, 2])
            data.append([biomass, biochar, ratio, kiln_encoded])
        
        # Edge cases (slightly off)
        for _ in range(50):
            biomass = np.random.uniform(200, 1000)
            ratio = np.random.uniform(0.18, 0.32)  # Slightly outside
            biochar = biomass * ratio
            kiln_encoded = np.random.choice([1, 2])
            data.append([biomass, biochar, ratio, kiln_encoded])
        
        X = np.array(data)
        
        # Train scaler
        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)
        
        # Train Isolation Forest (contamination = expected % of anomalies)
        self.model = IsolationForest(
            contamination=0.1,  # 10% of data expected to be anomalous
            random_state=42,
            n_estimators=100
        )
        self.model.fit(X_scaled)
        
        # Save model
        Path(self.model_path).parent.mkdir(parents=True, exist_ok=True)
        with open(self.model_path, 'wb') as f:
            pickle.dump(self.model, f)
        with open(self.scaler_path, 'wb') as f:
            pickle.dump(self.scaler, f)
        
        print(f"✅ Trained and saved model to {self.model_path}")
    
    def encode_kiln_type(self, kiln_type: str) -> int:
        """Encode categorical kiln type to numerical value"""
        return self.kiln_encoding.get(kiln_type, 1)  # Default to Batch Retort
    
    def predict(self, biomass_input: float, biochar_output: float, 
                kiln_type: str) -> dict:
        """
        Predict if a manufacturing record is anomalous.
        
        Args:
            biomass_input: Input biomass in kg
            biochar_output: Output biochar in kg
            kiln_type: Type of kiln used
        
        Returns:
            dict with ml_status, confidence_score, reason
        """
        
        if not self.model or not self.scaler:
            raise RuntimeError("Model not initialized")
        
        # Calculate features
        conversion_ratio = biochar_output / biomass_input if biomass_input > 0 else 0
        kiln_encoded = self.encode_kiln_type(kiln_type)
        
        # Feature vector: [biomass, biochar, ratio, kiln_type]
        X = np.array([[biomass_input, biochar_output, conversion_ratio, kiln_encoded]])
        
        # Scale features
        X_scaled = self.scaler.transform(X)
        
        # Get anomaly score (-1 to 1, where 1 is more anomalous)
        anomaly_label = self.model.predict(X_scaled)[0]  # -1 = anomaly, 1 = normal
        anomaly_score = self.model.score_samples(X_scaled)[0]
        
        # Convert to confidence score (0-1, where 1 = high confidence it's anomalous)
        # score_samples returns negative values; normalize to 0-1
        confidence_score = self._normalize_score(anomaly_score)
        
        # Determine status
        ml_status = "flagged" if anomaly_label == -1 else "verified"
        
        # Generate explanation
        reason = self._generate_reason(
            conversion_ratio, 
            biomass_input, 
            biochar_output, 
            confidence_score
        )
        
        return {
            "ml_status": ml_status,
            "confidence_score": round(confidence_score, 3),
            "anomaly_score": round(anomaly_score, 3),
            "conversion_ratio": round(conversion_ratio, 4),
            "reason": reason,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def _normalize_score(self, raw_score: float) -> float:
        """Convert Isolation Forest score to 0-1 confidence scale"""
        # Isolation Forest scores are typically in range [-1, 0.5]
        # Normalize to [0, 1] where 1 = highly anomalous
        normalized = -raw_score / 1.5  # Scale to roughly 0-1
        return max(0.0, min(1.0, normalized))
    
    def _generate_reason(self, ratio: float, biomass: float, 
                        biochar: float, confidence: float) -> str:
        """Generate human-readable explanation of the prediction"""
        
        reasons = []
        
        # Ratio analysis
        if ratio < 0.20:
            reasons.append(f"Very low ratio ({ratio:.2%})")
        elif ratio > 0.30:
            reasons.append(f"Very high ratio ({ratio:.2%})")
        else:
            reasons.append(f"Ratio within normal range ({ratio:.2%})")
        
        # Volume analysis
        if biomass < 100:
            reasons.append("Small batch volume")
        elif biomass > 2000:
            reasons.append("Large batch volume")
        
        # Confidence assessment
        if confidence > 0.7:
            reasons.append("High anomaly confidence")
        elif confidence > 0.4:
            reasons.append("Moderate anomaly signal")
        
        return " | ".join(reasons)
    
    def update_with_verified_record(self, biomass: float, biochar: float, 
                                    kiln_type: str):
        """
        Update training data with verified records for model refinement.
        (Optional: used for online learning)
        """
        ratio = biochar / biomass if biomass > 0 else 0
        kiln_encoded = self.encode_kiln_type(kiln_type)
        self.training_data.append([biomass, biochar, ratio, kiln_encoded])


# Global model instance
anomaly_detector = ManufacturingAnomalyDetector()


def get_anomaly_detector() -> ManufacturingAnomalyDetector:
    """Get the anomaly detector instance (singleton)"""
    return anomaly_detector
