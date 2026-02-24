# ── Stage 1: Build React frontend ──────────────────────────────
FROM node:22-slim AS frontend-build

WORKDIR /app

# Copy all files for the build
COPY package*.json ./
RUN npm config set legacy-peer-deps true && npm install --legacy-peer-deps

COPY public/ ./public/
COPY src/ ./src/

# Set the production API URL directly in environment
ENV REACT_APP_API_URL=https://web-production-dcbaf.up.railway.app

RUN npm run build

# ── Stage 2: Python backend + serve frontend ────────────────────
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libpq-dev \
    libgeos-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend source
COPY backend/ ./backend/

# Copy React build from Stage 1
COPY --from=frontend-build /app/build ./build

# Set environment variables
ENV PYTHONPATH=/app
ENV PORT=8000

EXPOSE 8000

CMD ["python3", "-m", "uvicorn", "backend.share:app", "--host", "0.0.0.0", "--port", "8000"]
