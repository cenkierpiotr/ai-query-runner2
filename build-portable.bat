@echo off
setlocal enabledelayedexpansion

echo === ai-query-runner portable build (Windows) ===

:: 1. Check for Bun
bun --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: bun is not installed. Install from https://bun.sh
    exit /b 1
)
echo bun is available.

:: 2. Install dependencies
call bun install || exit /b 1

:: 3. Prepare directory
if exist dist\portable rd /s /q dist\portable
mkdir dist\portable
mkdir dist\portable\public

:: 4. Compile Windows binary (playwright marked external — copied separately below)
echo Compiling Windows binary...
bun build src/index.ts --compile --target=bun-windows-x64 ^
  --external playwright --external playwright-core --external chromium-bidi ^
  --outfile=dist\portable\ai-query-runner.exe || exit /b 1

:: 5. Install Playwright Chromium
echo Downloading Chromium...
call npx playwright install chromium || exit /b 1

:: 6. Find and copy Chromium
echo Locating Chromium...
for /f "delims=" %%i in ('node -e "const {chromium}=require('playwright');chromium.executablePath().then(p=>{const path=require('path');console.log(path.dirname(path.dirname(p)));})"') do (
    set "PW_CHROMIUM_DIR=%%i"
)
echo Chromium source: %PW_CHROMIUM_DIR%
xcopy "%PW_CHROMIUM_DIR%" dist\portable\chromium\ /E /I /H /Y || exit /b 1

:: 7. Copy public assets
xcopy src\public dist\portable\public\ /E /I /H /Y || exit /b 1

:: 8. Copy playwright runtime (marked external in bundle)
echo Copying playwright runtime...
if not exist dist\portable\node_modules mkdir dist\portable\node_modules
xcopy node_modules\playwright dist\portable\node_modules\playwright\ /E /I /H /Y
xcopy node_modules\playwright-core dist\portable\node_modules\playwright-core\ /E /I /H /Y

:: 9. Create portable marker file
echo. > dist\portable\.portable

:: 10. Create ZIP using PowerShell
echo Creating ZIP...
if exist dist\ai-query-runner-portable-windows.zip del dist\ai-query-runner-portable-windows.zip
powershell -Command "Compress-Archive -Path 'dist\portable\*' -DestinationPath 'dist\ai-query-runner-portable-windows.zip' -Force" || exit /b 1

:: 10. Done
for %%I in (dist\ai-query-runner-portable-windows.zip) do (
    set /a size_mb=%%~zI / 1048576
    echo Build complete! dist\ai-query-runner-portable-windows.zip (!size_mb! MB)
)
