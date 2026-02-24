# Harit Swaraj: Biochar MRV Solution 🌱

Harit Swaraj is a digital platform for tracking the Biochar supply chain. It ensures transparency in carbon credits by verifying every step from the farm to the manufacturing plant.

---

## 🛠️ System Features

### 1. Land & Plot Management
*   **7/12 Land Records:** Direct entry for Survey Number, Village, Taluka, and District.
*   **KML Boundaries:** Support for uploading farm area maps.
*   **Geo-Fencing:** Automatically checks if photos were taken inside the farm boundary.

### 2. Supply Chain Tracking
*   **Harvesting:** Digital record-keeping for biomass collected from farms.
*   **Transportation:** Tracking trucks moving biomass from farms to factories.
*   **Manufacturing:** Recording biochar production batches and kiln types.
*   **Application:** Final records of biochar being used in soil.

### 3. Smart Verification (ML)
*   **Plot Analysis:** Detects unusual land sizes to prevent fake registrations.
*   **Production Check:** Verifies if the biochar output matches the biomass input.
*   **Evidence:** Captures time-stamped, GPS-tagged photos for every action.

---

## 🔄 User Journey & Process Flow

### **A. Farmer / Owner**
1.  **Register Plot:** Fill in 7/12 details and upload the farm boundary.
2.  **Record Harvest:** Enter the amount of biomass collected.
3.  **Manufacturing:** Log the biochar production data.

### **B. Auditor / Admin**
1.  **Dashboard:** Monitor total carbon sequestered and active plots.
2.  **Review:** Check photos and GPS data for any "Flagged" records.
3.  **Approval:** Verify batches for carbon credit generation.

---

## 💻 Tech Stack

*   **Mobile:** React Native (Capacitor) for Android.
*   **Backend:** Python with FastAPI.
*   **Database:** SQLite (File-based storage).
*   **AI/ML:** Scikit-Learn (for Anomaly Detection).
*   **Storage:** Local file system for photos and videos.

---

## 📂 Project Structure

*   **/src:** The React mobile application code.
*   **/backend:** The Python API, ML models, and database logic.
*   **/android:** The Android Studio project for building the APK.
*   **/docs:** Detailed technical guides and notes.

---

## 🚦 Getting Started

### 1. Requirements
*   Install **Python 3.10** and **Node.js**.

### 2. Start Backend
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app
```

### 3. Start Frontend
```bash
npm install
npm start
```

### 4. Build APK
*   Use `npx cap sync android` and build through Android Studio.

---
**Author:** Harit Swaraj Team | Feb 2026