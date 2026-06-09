@echo off
chcp 65001 >nul 2>&1
echo.
echo   Uruchamianie panelu AI Query Runner...
echo.

cd /d "%~dp0"

:: Sprawdz czy paczki sa zainstalowane
if not exist "node_modules" (
    echo  Pakiety nie sa zainstalowane. Uruchom najpierw install.bat!
    pause
    exit /b 1
)

:: Uruchom serwer w tle i otworz przegladarke
start http://localhost:3535
call npm run server

pause
