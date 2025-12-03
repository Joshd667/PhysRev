@echo off
echo ================================================
echo  Physics Revision App - Local Server
echo ================================================
echo.
echo Starting local server on http://localhost:8000
echo Press Ctrl+C to stop the server
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python from https://www.python.org/
    pause
    exit /b 1
)

REM Start the server and open browser
echo Opening browser...
start http://localhost:8000

echo Starting Python HTTP server...
echo.
python -m http.server 8000
