# Harit Swaraj: ML-Based Anomaly Detection for Biochar Manufacturing

## Overview

This document explains the ML-based anomaly detection system integrated into Harit Swaraj for detecting fraudulent biochar manufacturing claims.

---

## 1. Why ML for Biochar Verification?

### The Problem
In carbon credit systems, fraudsters can claim inflated biochar production to:
- **Overstate CO₂ removal** (e.g., claim 500 kg output from 1000 kg input → 50% ratio, unrealistic)
- **Exploit loopholes** in static rules (e.g., use kiln-specific anomalies not in rulebooks)
- **Create novel patterns** that bypass hardcoded checks

### Traditional Rule-Based Approach
```
if ratio < 0.20 or ratio > 0.30:
    flag_as_fraud()
```
❌ **Limitation**: Only catches known violations; misses novel patterns

### ML-Based Approach (Isolation Forest)
Uses unsupervised anomaly detection to learn what "normal" production looks like, then flags deviations.

✅ **Advantage**: Catches unknown/novel frauds without labeled fraud data

---

## 2. Why Rule-Based + ML Hybrid?

### Defense-in-Depth Strategy

**Layer 1: Rule-Based (Deterministic)**
- Fast, explainable, auditable
- Catches obvious violations (ratios < 0.20 or > 0.30)
- Low false positive rate
- Required for compliance

**Layer 2: ML-Based (Statistical)**
- Detects subtle anomalies
- Catches context-specific frauds (e.g., "batch retort kiln with 45% ratio")
- Assigns confidence scores
- Helps investigators prioritize audits

### Example: Hybrid Detection
```
Scenario: Batch with 0.25 ratio (passes rule check)
- Rule-based: ✅ Verified (within 0.20-0.30)
- ML detection: 🚨 Flagged (confidence 85%)
  - Reason: "Combination of high input + anomalous score in Continuous Retort"
- Final Status: 🚨 Flagged for investigation
```

### Benefits of Hybrid Approach
1. **No single point of failure** - Two independent systems
2. **Explainability** - Rules explain why; ML adds statistical confidence
3. **Auditability** - Both reasoning paths visible to auditors
4. **Adaptability** - ML learns new fraud patterns without code changes
5. **Regulatory compliance** - Rules satisfy standards; ML adds due diligence

---

## 3. Technical Implementation

### A. ML Model: Isolation Forest

**Why Isolation Forest?**
- Detects both global outliers (extreme ratios) and local anomalies (contextual oddities)
- No labeled fraud data needed (unsupervised)
- Efficient: O(N log N) complexity
- Produces interpretable anomaly scores
- Works well with small feature sets (4 features)

**How It Works:**
1. Recursively partitions feature space using random splits
2. Anomalies require fewer splits to isolate → get higher anomaly scores
3. Normal points require many splits → get lower anomaly scores

### B. Features Used

| Feature | Type | Range | Purpose |
|---------|------|-------|---------|
| `biomass_input` | Continuous | 100-2000 kg | Production scale |
| `biochar_output` | Continuous | 20-600 kg | Output quantity |
| `conversion_ratio` | Continuous | 0.20-0.30 | Efficiency metric |
| `kiln_type_encoded` | Categorical (1-4) | 1=Batch, 2=Continuous, 3=TLUD, 4=Rocket | Equipment type |

### C. Model Pipeline

```
Raw Input (biomass, biochar, kiln)
    ↓
Feature Engineering (ratio calculation, kiln encoding)
    ↓
StandardScaler (normalize to mean=0, std=1)
    ↓
Isolation Forest (contamination=10%)
    ↓
Anomaly Score (-1.5 to 0.5)
    ↓
Normalize to Confidence (0 to 1)
    ↓
Output: Status + Confidence
```

---

## 4. API Response Example

### Request
```bash
curl -X POST http://127.0.0.1:8000/manufacturing/record \
  -H "Content-Type: application/json" \
  -d {
    "batch_id": "BCH-004",
    "biomass_input": 1200,
    "biochar_output": 420,  # 35% ratio (anomalous)
    "kiln_type": "Batch Retort Kiln"
  }
```

### Response
```json
{
  "batch_id": "BCH-004",
  "biomass_input": 1200,
  "biochar_output": 420,
  "ratio": 0.35,
  "co2_removed": 317.5,
  "status": "flagged",
  "rule_status": "flagged",
  "ml_prediction": {
    "ml_status": "flagged",
    "confidence_score": 0.82,
    "anomaly_score": -0.456,
    "conversion_ratio": 0.35,
    "reason": "Very high ratio (35.00%) | Large batch volume | High anomaly confidence",
    "timestamp": "2024-01-23T10:30:45.123456"
  },
  "kiln_type": "Batch Retort Kiln",
  "timestamp": "2024-01-23T10:30:45.123456"
}
```

### Interpretation
- **status**: "flagged" (combined result)
- **rule_status**: "flagged" (exceeded 0.30 threshold)
- **ml_status**: "flagged" (anomaly detected)
- **confidence_score**: 0.82 = 82% confidence it's anomalous
- **reason**: Human-readable explanation for auditors

---

## 5. Frontend Display

### Manufacturing Form Enhancement

The React component now displays:

1. **Rule-Based Validation** (Immediate Feedback)
   ```
   ✅ Rules OK: Ratio within expected range (0.20-0.30)
   ```

2. **ML Anomaly Detection** (After Submission)
   ```
   ✅ ML Verified
   Confidence: 92%
   Ratio: 0.22
   Anomaly Score: -0.123
   
   --- OR ---
   
   🚨 ML Flagged
   Confidence: 85%
   Ratio: 0.35
   Anomaly Score: -0.456
   Very high ratio (35.00%) | High anomaly confidence
   ```

### Color Coding
- **Green**: Verified (both rules and ML agree)
- **Yellow**: Rule warning (might pass ML check)
- **Red**: Flagged (manual audit required)

---

## 6. Fraud Prevention Mechanisms

### Scenario 1: Simple Falsification
```
Farmer claims: 1000 kg biomass → 700 kg biochar (70% ratio)
- Rule-based: 🚨 Flagged (exceeds 0.30)
- ML: 🚨 Flagged (extreme outlier)
- Result: ❌ Rejected (double-flagged)
```

### Scenario 2: Sophisticated Attempt
```
Fraudster claims: 500 kg biomass → 125 kg biochar (25% ratio)
  + Uses TLUD kiln (different equipment signature)
- Rule-based: ✅ Verified (within 0.20-0.30)
- ML: 🚨 Flagged (contextual anomaly)
  * Reason: "TLUD + high output + unusual batch size combination"
- Result: 🚨 Flagged for investigation
```

### Scenario 3: Marginal Case
```
Farmer claims: 600 kg biomass → 156 kg biochar (26% ratio)
  + Batch Retort Kiln (standard)
- Rule-based: ✅ Verified (within range)
- ML: ✅ Verified (confidence 95%)
- Result: ✅ Approved (clean record)
```

---

## 7. Explainability & Auditability

### For Auditors
Each record contains:
- **Rule decision**: Clear threshold-based logic
- **ML decision**: Anomaly score + confidence
- **Feature values**: Input, output, ratio
- **Timestamp**: When detected

### Audit Trail Example
```
Record BCH-004:
├── Rule-Based Check
│   ├── Ratio: 0.35
│   ├── Threshold: 0.20-0.30
│   └── Decision: FLAGGED (exceeds max)
├── ML Anomaly Detection
│   ├── Anomaly Score: -0.456
│   ├── Confidence: 0.82
│   ├── Features: [1200, 420, 0.35, 1]
│   └── Decision: FLAGGED (novel pattern)
└── Final Decision: 🚨 FLAGGED (both agree)
```

### Why Isolation Forest is Auditable
1. **Feature importance**: Can show which features contributed to anomaly detection
2. **Score interpretation**: Negative scores = more anomalous
3. **No black box**: Algorithm logic is explainable
4. **Reproducible**: Same input → same output

---

## 8. Interview Explanation (30-60 seconds)

### The Pitch
"We built a hybrid fraud detection system combining rule-based validation with unsupervised machine learning. For biochar manufacturing, we validate conversion ratios against physical chemistry limits using hardcoded rules, then layer an Isolation Forest model trained on legitimate production data.

**Why this matters**: Rule-based systems catch obvious frauds, but miss sophisticated attempts. ML detects novel fraud patterns without requiring labeled fraud data. Together, they provide defense-in-depth: fast rules for obvious cases, ML for subtle anomalies.

**Example**: If someone claims 700 kg biochar from 1000 kg biomass, rules catch it. If they claim 250 kg from 800 kg (31% ratio, just barely outside range), plus use unusual kiln configuration, ML flags the contextual anomaly.

**Auditability**: Both decisions are explainable—rules show threshold violations, ML shows anomaly scores and contributing features. Perfect for carbon credit verification where auditors need transparency."

---

## 9. Model Training & Updates

### Initial Training
- Synthetic data: 500 normal scenarios + 50 edge cases
- Features: biomass (200-1000 kg), biochar (40-300 kg), ratio (0.18-0.32), kiln type (1-2)
- Isolation Forest: 100 estimators, 10% contamination
- Saved to: `backend/ml/models/isolation_forest.pkl`

### Future Improvements (Online Learning)
```python
# When auditors verify records as legitimate
anomaly_detector.update_with_verified_record(
    biomass=500,
    biochar=125,
    kiln_type="Batch Retort Kiln"
)
# Model can be retrained periodically
```

---

## 10. Deployment Checklist

- [x] ML module created (`backend/ml/manufacturing_anomaly.py`)
- [x] FastAPI endpoint integration (`/manufacturing/record`)
- [x] Model singleton initialization (startup)
- [x] React component updated (show ML results)
- [x] Error handling (fallback if ML fails)
- [x] Hybrid decision logic (rule + ML)
- [ ] Model metrics collection (accuracy, precision)
- [ ] Periodic retraining pipeline
- [ ] ML model versioning
- [ ] A/B testing framework (rule vs ML vs hybrid)

---

## 11. Files Overview

```
backend/
├── ml/
│   ├── __init__.py
│   ├── manufacturing_anomaly.py      ← ML model logic
│   └── models/
│       ├── isolation_forest.pkl      ← Trained model (auto-created)
│       └── scaler.pkl                ← Feature scaler
├── main.py                            ← FastAPI integration
└── __pycache__/

src/
└── App.js                            ← React frontend (updated)
```

---

## 12. Dependencies Required

Add to `backend/requirements.txt`:
```
fastapi==0.104.1
scikit-learn==1.3.2
numpy==1.24.3
pydantic==2.0.0
```

Install:
```bash
pip install -r backend/requirements.txt
```

---

## Summary

| Aspect | Details |
|--------|---------|
| **Model** | Isolation Forest (100 estimators) |
| **Features** | biomass, biochar, ratio, kiln_type |
| **Output** | status (verified/flagged) + confidence (0-1) |
| **Approach** | Unsupervised anomaly detection |
| **Explainability** | Anomaly scores + feature analysis |
| **Auditability** | Rule + ML decision trail |
| **MRV-Compliance** | Rule-based standards + ML verification |
| **Fraud Detection** | Catches both obvious and sophisticated attempts |

This system provides **explainable, auditable ML** that enhances carbon credit verification without sacrificing transparency.
