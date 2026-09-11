@echo off
title SANKET · AI — 1-Click Demo Launcher
color 0A
cls
echo =====================================================================
echo   SANKET . AI - SIF Precursor Detection Platform
echo   Smart India Hackathon 2026 - Oil India Limited (SIH26165)
echo =====================================================================
echo.

:: Get local IP address for mobile phone demonstration
set LOCAL_IP=127.0.0.1
for /f "tokens=4" %%a in ('route print ^| findstr 0.0.0.0.*0.0.0.0') do (
    set LOCAL_IP=%%a
    goto :found_ip
)
:found_ip

echo [1/3] Launching FastAPI Backend Server on Port 8000 (0.0.0.0)...
start "SANKET Backend (Port 8000)" cmd /k "python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000"

echo [2/3] Launching Next.js 16 Frontend on Port 3000...
start "SANKET Frontend (Port 3000)" cmd /k "cd frontend && npm run dev"

echo [3/3] Waiting for servers to initialize...
timeout /t 5 /nobreak >nul

echo.
echo =====================================================================
echo   [OK] SANKET . AI IS READY FOR DEMONSTRATION!
echo =====================================================================
echo.
echo   * Safety Manager HQ Console:   http://localhost:3000
echo   * Field Worker ATEX Terminal:  http://localhost:3000/worker
echo   * Mobile Phone Live Link:      http://%LOCAL_IP%:3000/worker
echo   * Backend REST API & Swagger:  http://localhost:8000/docs
echo.
echo   Opening Safety Manager HQ in your default browser...
start http://localhost:3000

echo.
echo Press any key to exit this launcher window (servers remain running).
pause >nul
