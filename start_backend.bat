@echo off
cd backend
echo Starting backend server on 0.0.0.0:8000...
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
pause
