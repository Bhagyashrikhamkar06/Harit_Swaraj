# ── Stage 1: Build React frontend ──────────────────────────────
FROM node:18-slim AS frontend-build

WORKDIR /app

COPY package*.json ./
RUN npm config set legacy-peer-deps true && npm install

COPY public/ ./public/
COPY src/ ./src/

RUN npm run build

# ── Stage 2: Python backend + serve frontend ────────────────────
FROM python:3.11-slim

WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend source
COPY backend/ ./backend/

# Copy React build from Stage 1
COPY --from=frontend-build /app/build ./build

# Expose port
EXPOSE 8000

# Start FastAPI server (share.py serves React build + API)
CMD ["sh", "-c", "cd backend && python3 -m uvicorn share:app --host 0.0.0.0 --port ${PORT:-8000}"]
