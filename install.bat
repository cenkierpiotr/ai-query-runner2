@echo off
chcp 65001 >nul 2>&1
setlocal EnableDelayedExpansion

echo.
echo  =====================================================
echo   AI Query Runner - Instalator (Windows)
echo   Excel / Google Sheets - AI - Excel / Sheets
echo  =====================================================
echo.

cd /d "%~dp0"

:: ── Krok 1: Sprawdz / zainstaluj Node.js ─────────────────────────────────────
echo  Krok 1/4: Sprawdzanie Node.js...
echo.

set NODE_OK=0

where node >nul 2>&1
if %errorlevel% equ 0 (
    node -e "process.exit(parseInt(process.version.slice(1)) >= 18 ? 0 : 1)" >nul 2>&1
    if !errorlevel! equ 0 (
        for /f %%i in ('node --version') do echo   [OK] Node.js %%i
        set NODE_OK=1
    ) else (
        for /f %%i in ('node --version') do echo   [!] Node.js %%i za stary ^(wymagana v18+^). Aktualizuje...
    )
)

:: Jesli Node nie OK, sprobuj zainstalowac przez winget
if !NODE_OK! equ 0 (
    echo.
    echo   Instalowanie Node.js automatycznie...
    echo.

    :: Sprawdz winget (dostepny na Windows 10 1709+ i Windows 11)
    where winget >nul 2>&1
    if !errorlevel! equ 0 (
        echo   Instalowanie przez winget...
        winget install --id OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
        if !errorlevel! equ 0 (
            :: Odswierz PATH w biezacej sesji
            for /f "tokens=*" %%i in ('powershell -Command "[System.Environment]::GetEnvironmentVariable(\"Path\", \"Machine\")"') do set "PATH=%%i;%PATH%"
            where node >nul 2>&1
            if !errorlevel! equ 0 (
                for /f %%i in ('node --version') do echo   [OK] Node.js %%i zainstalowany przez winget
                set NODE_OK=1
            )
        )
    )
)

:: Jesli winget zawiodt, pobierz instalator MSI przez PowerShell
if !NODE_OK! equ 0 (
    echo.
    echo   Pobieranie instalatora Node.js przez PowerShell...
    set "NODE_MSI=%TEMP%\node_installer.msi"
    powershell -NoProfile -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.16.0/node-v20.16.0-x64.msi' -OutFile '!NODE_MSI!'" >nul 2>&1
    if exist "!NODE_MSI!" (
        echo   Instalowanie Node.js ^(okno moze sie pojawic - zaakceptuj^)...
        msiexec /i "!NODE_MSI!" /quiet /norestart
        del "!NODE_MSI!" >nul 2>&1

        :: Odswierz PATH
        for /f "tokens=*" %%i in ('powershell -Command "[System.Environment]::GetEnvironmentVariable(\"Path\", \"Machine\")"') do set "PATH=%%i;%PATH%"
        where node >nul 2>&1
        if !errorlevel! equ 0 (
            for /f %%i in ('node --version') do echo   [OK] Node.js %%i zainstalowany
            set NODE_OK=1
        )
    )
)

if !NODE_OK! equ 0 (
    echo.
    echo  [BLAD] Nie udalo sie zainstalowac Node.js automatycznie.
    echo.
    echo  Zainstaluj recznie ze strony:
    echo  https://nodejs.org/en/download
    echo  (wybierz "Windows Installer" i uruchom plik .msi)
    echo.
    pause
    exit /b 1
)

:: ── Krok 2: Instalacja pakietow npm ──────────────────────────────────────────
echo.
echo  ──────────────────────────────────────────────────────
echo  Krok 2/4: Instalacja pakietow npm...
echo.

if not exist "node_modules" (
    call npm install
    if !errorlevel! neq 0 (
        echo  [BLAD] npm install nie powiodl sie.
        pause
        exit /b 1
    )
    echo   [OK] Pakiety npm zainstalowane
) else (
    echo   [OK] Pakiety npm - juz zainstalowane
)

:: ── Krok 3: Instalacja Chromium ───────────────────────────────────────────────
echo.
echo  ──────────────────────────────────────────────────────
echo  Krok 3/4: Instalacja przegladarki Chromium (~150MB)...
echo.

call npx playwright install chromium
if !errorlevel! equ 0 (
    echo   [OK] Chromium zainstalowany
) else (
    echo   [!] Chromium nie mogl byc zainstalowany automatycznie.
    echo       Sprobuj recznie: npx playwright install chromium
)

:: ── Krok 4: Kreator konfiguracji ─────────────────────────────────────────────
echo.
echo  ──────────────────────────────────────────────────────
echo  Krok 4/4: Konfiguracja...
echo.

call npx tsx src/wizard.ts

:: ── Koniec ────────────────────────────────────────────────────────────────────
echo.
echo  ======================================================
echo   Instalacja zakonczona!
echo.
echo   Uruchom narzedzie poleceniem:
echo     npx tsx src/main.ts --input queries.xlsx
echo  ======================================================
echo.
pause
