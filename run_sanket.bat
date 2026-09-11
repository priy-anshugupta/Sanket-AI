@echo off
title SANKET AI Launcher
echo ===================================================
echo   SANKET AI - One-Click System Launcher
echo   Oil India Limited - SIH 2026
echo ===================================================
echo.
echo Starting FastAPI Backend on http://0.0.0.0:8000...
start "SANKET Backend (Port 8000)" cmd /k "python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload"

echo Starting Next.js Frontend on http://0.0.0.0:3000...
start "SANKET Frontend (Port 3000)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ===================================================
echo System Launched Successfully!
echo Laptop Dashboard: http://localhost:3000/dashboard
echo Phone Dashboard:  http://10.58.177.169:3000/worker
echo ===================================================
timeout /t 4
