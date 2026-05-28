@echo off
echo Starting local server for mfo_support...
echo Open http://localhost:8080/card-viewer.html in your browser
echo Press Ctrl+C to stop
echo.
python -m http.server 8080
pause
