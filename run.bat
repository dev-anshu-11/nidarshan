@echo off
setlocal EnableDelayedExpansion
title NIDARSHAN Launcher

:: =========================================================
::  NIDARSHAN  run.bat
::  Double-click or run from any terminal to start the app.
::  Handles: pnpm path, dependencies, native binaries,
::           DB schema, and launches the dev server.
:: =========================================================

cls
echo.
echo  +--------------------------------------------------+
echo  ^|        NIDARSHAN  - Forensic Platform            ^|
echo  ^|        Automated Launcher  v1.1                  ^|
echo  +--------------------------------------------------+
echo.

:: ---------------------------------------------------------
:: Step 1: Locate pnpm
:: ---------------------------------------------------------
set "PNPM_CMD="

:: Check if pnpm is already on PATH
where pnpm >nul 2>&1
if %ERRORLEVEL% == 0 (
    set "PNPM_CMD=pnpm"
    goto :pnpm_found
)

:: Try the npm global bin (most common Windows install location)
if exist "%APPDATA%\npm\pnpm.cmd" (
    set "PNPM_CMD=%APPDATA%\npm\pnpm.cmd"
    goto :pnpm_found
)

:: Try corepack shim location
if exist "%LOCALAPPDATA%\node\pnpm.cmd" (
    set "PNPM_CMD=%LOCALAPPDATA%\node\pnpm.cmd"
    goto :pnpm_found
)

:: pnpm not found - install via npm
echo  [SETUP] pnpm not found. Installing via npm...
call npm install -g pnpm
if %ERRORLEVEL% neq 0 (
    echo.
    echo  [ERROR] Could not install pnpm.
    echo          Make sure Node.js is installed: https://nodejs.org
    echo.
    pause
    exit /b 1
)
set "PNPM_CMD=%APPDATA%\npm\pnpm.cmd"

:pnpm_found
echo  [OK] pnpm  : %PNPM_CMD%

:: ---------------------------------------------------------
:: Step 2: Check Node.js
:: ---------------------------------------------------------
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo.
    echo  [ERROR] Node.js not found.
    echo          Download from: https://nodejs.org
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node --version 2^>^&1') do set NODE_VER=%%v
echo  [OK] node  : %NODE_VER%

:: ---------------------------------------------------------
:: Step 3: Install dependencies (first run only)
:: ---------------------------------------------------------
if not exist "node_modules\" (
    echo  [SETUP] Installing dependencies - first run, please wait...
    call "%PNPM_CMD%" install
    if %ERRORLEVEL% neq 0 (
        echo.
        echo  [ERROR] pnpm install failed. Check your internet connection.
        echo.
        pause
        exit /b 1
    )
    echo  [OK] Dependencies installed.
) else (
    echo  [OK] node_modules present.
)

:: ---------------------------------------------------------
:: Step 4: Patch better-sqlite3 native binary if missing
:: ---------------------------------------------------------
set "SQLITE_BUILD=node_modules\.pnpm\better-sqlite3@13.0.3\node_modules\better-sqlite3\build\Release\better_sqlite3.node"
set "SQLITE_PREBUILD=node_modules\.pnpm\better-sqlite3@13.0.3\node_modules\better-sqlite3\prebuilds\win32-x64.node"
set "SQLITE_RELEASE_DIR=node_modules\.pnpm\better-sqlite3@13.0.3\node_modules\better-sqlite3\build\Release"

if not exist "%SQLITE_BUILD%" (
    echo  [SETUP] Patching better-sqlite3 native binary for Windows...
    if exist "%SQLITE_PREBUILD%" (
        if not exist "%SQLITE_RELEASE_DIR%\" mkdir "%SQLITE_RELEASE_DIR%"
        copy /Y "%SQLITE_PREBUILD%" "%SQLITE_BUILD%" >nul
        echo  [OK] Native binary patched from prebuilds.
    ) else (
        echo  [WARN] Prebuilt binary not found. Trying pnpm rebuild...
        call "%PNPM_CMD%" rebuild better-sqlite3
        if %ERRORLEVEL% neq 0 (
            echo.
            echo  [ERROR] better-sqlite3 rebuild failed.
            echo          Install Visual Studio Build Tools:
            echo          https://visualstudio.microsoft.com/visual-cpp-build-tools/
            echo.
            pause
            exit /b 1
        )
        echo  [OK] Native binary rebuilt.
    )
) else (
    echo  [OK] better-sqlite3 binary present.
)

:: ---------------------------------------------------------
:: Step 5: Verify database engine loads
:: ---------------------------------------------------------
node -e "require('./node_modules/.pnpm/better-sqlite3@13.0.3/node_modules/better-sqlite3')" >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo.
    echo  [ERROR] better-sqlite3 failed to load.
    echo          Try deleting node_modules and running run.bat again.
    echo.
    pause
    exit /b 1
)
echo  [OK] Database engine verified.

:: ---------------------------------------------------------
:: Step 6: Sync database schema
:: ---------------------------------------------------------
echo  [DB]  Syncing database schema...
call "%PNPM_CMD%" db:push >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo  [WARN] db:push had an issue - server will still start.
) else (
    echo  [OK] Database schema up to date.
)

:: ---------------------------------------------------------
:: Step 7: Write a helper script for the server window
::         (avoids quoting hell with pnpm path that has spaces)
:: ---------------------------------------------------------
set "HELPER=%TEMP%\nidarshan_start.cmd"
(
    echo @echo off
    echo title NIDARSHAN Server
    echo set "PATH=%APPDATA%\npm;%PATH%"
    echo cls
    echo echo.
    echo echo  NIDARSHAN dev server starting...
    echo echo  Open http://localhost:3000 in your browser
    echo echo  Press Ctrl+C to stop the server.
    echo echo.
    echo call "%PNPM_CMD%" dev
    echo echo.
    echo echo  Server stopped. Press any key to close.
    echo pause ^>nul
) > "%HELPER%"

:: ---------------------------------------------------------
:: Step 8: Launch server in a new window
:: ---------------------------------------------------------
echo.
echo  [START] Launching NIDARSHAN dev server in a new window...
start "NIDARSHAN Server" cmd /c "%HELPER%"

:: ---------------------------------------------------------
:: Step 9: Open browser after delay
:: ---------------------------------------------------------
echo  [INFO] Waiting for server to start (6 seconds)...
timeout /t 6 /nobreak >nul
start "" "http://localhost:3000"
echo  [OK] Browser launched at http://localhost:3000

echo.
echo  +--------------------------------------------------+
echo  ^|  NIDARSHAN is running.                           ^|
echo  ^|  Server: "NIDARSHAN Server" in your taskbar      ^|
echo  ^|  Stop  : Ctrl+C in the server window             ^|
echo  +--------------------------------------------------+
echo.
pause
endlocal
