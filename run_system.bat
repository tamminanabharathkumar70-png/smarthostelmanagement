@echo off
title HostelPulse - Smart Hostel Management System Launcher
echo ===================================================
echo   🏠 HOSTELPULSE - SMART HOSTEL MANAGEMENT SYSTEM
echo ===================================================
echo Starting Python Web Server...
cd /d "%~dp0"
start "" http://localhost:8000
python server.py
pause
