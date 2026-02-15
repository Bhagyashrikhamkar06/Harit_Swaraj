# 📄 Harit Swaraj - Technical Implementation Report

**Project Name:** Harit Swaraj  
**Type:** Biochar MRV (Monitoring, Reporting, Verification) & Supply Chain System  
**Platform:** Web & Mobile (Android)  

---

## 🛠️ 1. Technology Stack

### **Frontend (User Interface)**
- **React.js:** The core framework for building the dynamic user interface.
- **Tailwind CSS:** For rapid, responsive, and modern styling (used for the green theme, cards, and sidebar).
- **Lucide React:** For the modern icon set (Leaf, Truck, Factory icons).
- **Capacitor.js:** To convert the React web application into a native **Android APK**.
- **React-i18next:** For multi-language support (English/Hindi).

### **Backend (API & Logic)**
- **FastAPI (Python):** High-performance web framework for handling API requests. Chosen for its speed and easy integration with AI libraries.
- **SQLAlchemy:** ORM (Object Relational Mapper) to interact with the database using Python objects instead of raw SQL.
- **Pydantic:** For data validation (ensuring inputs like "weight" are numbers, emails are valid, etc.).
- **Uvicorn:** ASGI server to run the Python backend asynchronously.

### **Database (Storage)**
- **SQLite (Current):** Lightweight file-based database for development and testing.
- **Scalable to PostgreSQL:** The architecture allows easy switching to PostgreSQL for production.

### **AI & Computer Vision (The "Smart" Part)**
- **OpenCV (cv2):** Used for image processing (analyzing uploaded plot photos).
- **ExifRead:** To extract **GPS Metadata** (Latitude/Longitude) and timestamps from uploaded plot photos implicitly.
- **ImageHash:** For detecting duplicate images (fraud prevention).
- **TensorFlow/Keras (Ready):** The backend structure supports loading ML models for biomass species detection.

### **Security**
- **JWT (JSON Web Tokens):** For stateless user authentication (Login/Logout).
- **BCrypt:** For hashing passwords (security best practice) before storing them in the database.

---

## 🏗️ 2. How We Implemented Key Features

### **A. Mobile & Web Compatibility (Hybrid Architecture)**
*   **Implementation:** We built a **Single Page Application (SPA)** using React.
*   **Mobile Magic:** We used **Capacitor** to wrap this web app. Capacitor creates a "bridge" allowing the web code to run as a native Android app (`.apk`).
*   **Responsive Design:** We used Tailwind's responsive classes (e.g., `md:flex`, `hidden md:block`) so the Sidebar minimizes on phone screens and expands on laptops.

### **B. GPS Verification System**
*   **Goal:** Ensure biomass actually comes from the claimed location.
*   **Implementation:**
    1.  User uploads 4 photos in the "Biomass Identification" module.
    2.  The Frontend sends these files to the Backend via `FormData`.
    3.  **Backend Logic (`plot.py`):**
        *   The `extract_exif()` function reads the image metadata.
        *   It extracts GPS Latitude/Longitude and DateTime.
        *   It calculates the **centroid (average location)** of the 4 photos.
        *   It stores this verified location in the database.

### **C. The Sidebar Navigation**
*   **Goal:** Modern, app-like navigation.
*   **Implementation:**
    *   Created a `Sidebar.js` component.
    *   Used **State Management (`useState`)** to handle the "Minimize/Expand" toggle.
    *   Implemented **Role-Based Rendering:** The sidebar checks `currentUser.role` (e.g., "Farmer" vs "Owner") and only shows relevant links (Farmers see "My Plots", Owners see "All Plots").

### **D. Carbon Credit Calculation (MRV)**
*   **Goal:** Quantify environmental impact.
*   **Implementation:**
    *   **Data Collection:** We track `biomass_weight` (Harvest) → `biochar_produced` (Manufacturing).
    *   **Calculation:**
        *   The backend calculates sequestered CO₂ using the formula:
        *   `CO₂ Sequestered = Biochar Weight * Conversion Factor (approx 3.0-3.6)`
    *   **Display:** The Dashboard API (`dashboard.py`) aggregates this data based on the user's role and serves it to the frontend via the `/dashboard/summary` endpoint.

---

## 🔄 3. System Architecture Diagram

```mermaid
[ Android Phone ]      [ Laptop / Browser ]
       |                       |
       v                       v
[     Frontend (React + Tailwind)     ]
[       (Capacitor for Android)       ]
                   |
            REST API (JSON)
                   |
                   v
[          Backend (FastAPI)          ]
[   - Auth System (JWT)               ]
[   - CV Module (OpenCV/GPS)          ]
[   - Supply Chain Logic              ]
                   |
                   v
[         Database (SQLite)           ]
[ Tables: Users, Plots, Batches, etc. ]
```

---

## 🎯 4. Why This Stack?

1.  **FastAPI** is fast and natively supports concurrent requests, essential for handling multiple image uploads.
2.  **React + Capacitor** allows maintaining **one codebase** for both Web and Android, saving 50% of development time.
3.  **Tailwind CSS** ensures the app looks professional and "premium" without writing thousands of lines of custom CSS.
4.  **Python Backend** was chosen specifically because it is the standard for **AI/ML integration**, making future upgrades (like satellite analysis) seamless.
