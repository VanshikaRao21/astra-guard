@echo off
echo Starting ASTRA-GUARD Phase 1 MVP

set MSOD_DATASET_PATH=C:\Users\ADMIN\.gemini\antigravity\scratch\mock_MSOD

echo Starting Backend...
cd backend
start cmd /k "python main.py"

cd ..\frontend
echo Starting Frontend...
start cmd /k "npm run dev"

echo Done! Both servers are starting in separate windows.
