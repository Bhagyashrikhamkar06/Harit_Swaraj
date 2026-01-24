# Quick Setup Guide: ML Integration for Harit Swaraj

## Prerequisites
- Python 3.8+
- Node.js 16+
- pip (Python package manager)

## Step 1: Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

**What gets installed:**
- `fastapi` - Web framework
- `scikit-learn` - ML library
- `numpy` - Numerical computing
- `pydantic` - Data validation

## Step 2: Start Backend Server

```bash
cd backend
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

**Expected output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     ✅ Loaded pre-trained model from backend/ml/models/isolation_forest.pkl
(or if first run)
INFO:     ⚠️ Model not found. Training with synthetic data...
INFO:     ✅ Trained and saved model to backend/ml/models/isolation_forest.pkl
```

## Step 3: Start Frontend

In a new terminal:
```bash
npm start
```

**Expected output:**
```
Compiled successfully!
You can now view harit-swaraj in the browser.
http://localhost:3000
```

## Step 4: Test the ML Integration

### Option A: Using the Frontend
1. Navigate to http://localhost:3000
2. Select "Owner" role
3. Go to "Manufacturing" tab
4. Fill in:
   - Batch ID: BCH-TEST-001
   - Kiln Type: Batch Retort Kiln
   - Input Biomass: 500 kg
   - Output Biochar: 125 kg
5. Click "Record Production"
6. See ML results appear below the form

### Option B: Using curl
```bash
curl -X POST http://127.0.0.1:8000/manufacturing/record \
  -H "Content-Type: application/json" \
  -d '{
    "batch_id": "BCH-MANUAL",
    "biomass_input": 500,
    "biochar_output": 125,
    "kiln_type": "Batch Retort Kiln"
  }'
```

**Expected response:**
```json
{
  "batch_id": "BCH-MANUAL",
  "biomass_input": 500,
  "biochar_output": 125,
  "ratio": 0.25,
  "co2_removed": 94.17,
  "status": "verified",
  "ml_prediction": {
    "ml_status": "verified",
    "confidence_score": 0.95,
    "conversion_ratio": 0.25,
    "reason": "Ratio within normal range (25.00%)"
  }
}
```

## Step 5: Verify Everything Works

### Check Model Files
```bash
ls -la backend/ml/models/
# Should see:
# isolation_forest.pkl (50KB)
# scaler.pkl (1KB)
```

### Check Dashboard
1. Go to Dashboard tab in frontend
2. Should see "Biochar Batches" table
3. Records should show status (green=verified, red=flagged)

## Troubleshooting

### Issue: "ModuleNotFoundError: No module named 'sklearn'"
**Solution:**
```bash
pip install scikit-learn
```

### Issue: "Connection refused" on /manufacturing/record
**Solution:**
- Make sure backend is running: `python -m uvicorn main:app --reload`
- Check it's on port 8000: http://127.0.0.1:8000
- Check CORS headers are correct in main.py

### Issue: ML model not loading
**Solution:**
```bash
# Delete existing models and let it retrain
rm -rf backend/ml/models/
# Restart backend
python -m uvicorn main:app --reload
```

### Issue: Slow startup
**First run** trains the model (takes ~5-10 seconds). Subsequent runs load the cached model (~1 second).

## Project Structure

```
harit-swaraj/
├── backend/
│   ├── ml/
│   │   ├── __init__.py
│   │   ├── manufacturing_anomaly.py    ← ML model
│   │   └── models/
│   │       ├── isolation_forest.pkl    ← (auto-created)
│   │       └── scaler.pkl              ← (auto-created)
│   ├── main.py                         ← FastAPI server
│   └── requirements.txt
├── src/
│   ├── App.js                          ← React UI
│   └── ...
├── ML_DOCUMENTATION.md                 ← Full explanation
├── ML_API_EXAMPLES.md                  ← Request/response examples
└── SETUP.md                            ← This file
```

## What's New

### Backend Changes (`main.py`)
- ✅ Imports ML module at startup
- ✅ Initializes anomaly detector (singleton pattern)
- ✅ Adds ML prediction to `/manufacturing/record` endpoint
- ✅ Returns combined rule + ML decision

### Frontend Changes (`App.js`)
- ✅ Shows rule-based validation alerts
- ✅ Displays ML anomaly detection results
- ✅ Shows confidence score (0-100%)
- ✅ Color-codes: green=verified, red=flagged

### New Files
- `backend/ml/manufacturing_anomaly.py` - Isolation Forest model
- `backend/ml/__init__.py` - Module initialization
- `backend/requirements.txt` - Python dependencies
- `ML_DOCUMENTATION.md` - Full technical guide
- `ML_API_EXAMPLES.md` - Curl examples + test cases
- `SETUP.md` - Quick start guide (this file)

## Key Features

| Feature | Description |
|---------|-------------|
| **Hybrid Detection** | Rule-based (0.20-0.30 ratio) + ML (Isolation Forest) |
| **Explainable** | Confidence scores + reason strings |
| **Fast** | ~10-15ms per prediction |
| **Auditable** | Both rule + ML decisions in response |
| **No Fraud Data Needed** | Unsupervised learning on normal data |
| **Real-time** | Integrated into API response |

## Next Steps (Advanced)

1. **Monitor ML Performance**
   - Track confidence scores over time
   - Collect audit feedback (false positives/negatives)

2. **Retrain Model**
   - As you collect verified records
   - Improve anomaly detection with real data

3. **Add More Features**
   - Timestamp patterns (time-of-day)
   - User/facility profiles
   - Seasonal adjustments

4. **Deploy to Production**
   - Use Docker for containerization
   - Set up model versioning
   - Create monitoring/alerting

## Support

For questions about the ML system:
- See `ML_DOCUMENTATION.md` for technical details
- See `ML_API_EXAMPLES.md` for request/response formats
- Check server logs for model loading status

## Success Criteria

✅ You're done when:
1. Backend starts without errors
2. Frontend displays manufacturing form
3. Submitting a record returns ML results
4. Dashboard shows batch status (verified/flagged)
5. ML confidence score displayed with results

---

**Happy Testing!** 🚀
