@echo off
echo Starting Scenario Editor...
echo.

:: Start the Python HTTP server in background
start /B python -m http.server 8000 > nul 2>&1

:: Wait a moment for the server to start
timeout /t 2 /nobreak > nul

:: Open the browser
start http://localhost:8000/scenario-editor.html

echo Server running at http://localhost:8000
echo.
echo Press any key to stop the server and exit...
pause > nul

:: Kill the Python server
taskkill /F /IM python.exe > nul 2>&1

echo Server stopped.
