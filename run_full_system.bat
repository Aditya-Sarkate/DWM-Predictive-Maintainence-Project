@echo off
title Predictive Maintenance DWM System
echo ======================================================================
echo  Launching Predictive Maintenance Data Warehouse & Mining System
echo ======================================================================
echo  1. Starting Backend & Warehouse API Server (Port 8000)...
start "DWM Backend API" cmd /k "cd /d %~dp0\backend && python -m uvicorn main:app --host 127.0.0.1 --port 8000"

echo  2. Waiting for server to initialize...
timeout /t 3 /nobreak >nul

echo  3. Opening Application in Default Browser...
start http://127.0.0.1:8000

echo ======================================================================
echo  System is running live!
echo  - Web Application: http://127.0.0.1:8000
echo  - Interactive Swagger API Docs: http://127.0.0.1:8000/docs
echo ======================================================================
pause
