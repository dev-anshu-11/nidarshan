@echo off
setlocal EnableDelayedExpansion
title NIDARSHAN — Launcher

:: ═══════════════════════════════════════════════════════════════
::  NIDARSHAN  run.bat
::  Double-click or run from any terminal to start the project.
::  Handles: pnpm path, dependencies, native binaries, DB schema,
::           and launches the dev server in a new window.
:: ═══════════════════════════════════════════════════════════════

cls
echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║          NIDARSHAN  —  Forensic Platform         ║
echo  ║          Automated Launcher  v1.0                ║
echo  ╚══════════════════════════════════════════════════╝
echo.

:: ── Step 1: Locate pnpm ─────────────────────────────────────────
set "PNPM_CMD="

:: Check if pnpm is already on PATH
where pnpm >nul 2>&1
if %ERRORLEVEL% == 0 (
    set "PNPM_CMD=pnpm"
    goto :pnpm_found
)

:: Try the npm global bin (most common Windows location)
set "NPM_PNPM=%APPDATA%\npm\pnpm.cmd"
if exist "%NPM_PNPM%" (
    set "PNPM_CMD=%NPM_PNPM%"
    goto :pnpm_found
)

:: Try corepack shims
set "COREPACK_PNPM=%LOCALAPPDATA%\node\pnpm.cmd"
if exist "%COREPACK_PNPM%" (
    set "PNPM_CMD=%COREPACK_PNPM%"
    goto :pnpm_found
)

:: pnpm not found — install it
echo  [SETUP] pnpm not found. Installing via npm...
call npm install -g pnpm >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo  [ERROR] Could not install pnpm. Make sure Node.js is installed.
    echo          Download from: https://nodejs.org
    pause
    exit /b 1
)
set "PNPM_CMD=%APPDATA%\npm\pnpm.cmd"

:pnpm_found
echo  [OK] pnpm found: %PNPM_CMD%

:: ── Step 2: Check Node.js ────────────────────────────────────────
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo  [ERROR] Node.js not found. Download from: https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node --version 2^>^&1') do set NODE_VER=%%v
echo  [OK] Node.js %NODE_VER%

:: ── Step 3: Install dependencies if node_modules is missing ─────
if not exist "node_modules\" (
    echo  [SETUP] Installing dependencies (first run — this may take a minute)...
    call "%PNPM_CMD%" install
    if %ERRORLEVEL% neq 0 (
        echo  [ERROR] pnpm install failed. Check your internet connection.
        pause
        exit /b 1
    )
    echo  [OK] Dependencies installed.
) else (
    echo  [OK] node_modules present — skipping install.
)

:: ── Step 4: Fix better-sqlite3 native binary if missing ─────────
set "SQLITE_BUILD=node_modules\.pnpm\better-sqlite3@13.0.3\node_modules\better-sqlite3\build\Release\better_sqlite3.node"
set "SQLITE_PREBUILD=node_modules\.pnpm\better-sqlite3@13.0.3\node_modules\better-sqlite3\prebuilds\win32-x64.node"

if not exist "%SQLITE_BUILD%" (
    echo  [SETUP] Applying better-sqlite3 prebuilt binary for Windows...
    if exist "%SQLITE_PREBUILD%" (
        if not exist "node_modules\.pnpm\better-sqlite3@13.0.3\node_modules\better-sqlite3\build\Release\" (
            mkdir "node_modules\.pnpm\better-sqlite3@13.0.3\node_modules\better-sqlite3\build\Release\"
        )
        copy /Y "%SQLITE_PREBUILD%" "%SQLITE_BUILD%" >nul
        echo  [OK] Native binary patched.
    ) else (
        echo  [WARN] Prebuilt binary not found. Attempting rebuild...
        call "%PNPM_CMD%" rebuild better-sqlite3 >nul 2>&1
        if %ERRORLEVEL% neq 0 (
            echo  [ERROR] better-sqlite3 rebuild failed.
            echo          Install Visual Studio Build Tools from:
            echo          https://visualstudio.microsoft.com/visual-cpp-build-tools/
            pause
            exit /b 1
        )
        echo  [OK] Native binary rebuilt.
    )
) else (
    echo  [OK] better-sqlite3 native binary present.
)

:: ── Step 5: Verify better-sqlite3 loads correctly ───────────────
node -e "require('./node_modules/.pnpm/better-sqlite3@13.0.3/node_modules/better-sqlite3')" >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo  [ERROR] better-sqlite3 failed to load after patching.
    pause
    exit /b 1
)
echo  [OK] Database engine verified.

:: ── Step 6: Push DB schema (safe — only applies changes) ────────
echo  [DB]   Applying database schema...
call "%PNPM_CMD%" db:push >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo  [WARN] db:push returned an error — server will still start.
    echo         Check nidarshan.db manually if issues occur.
) else (
    echo  [OK] Database schema up to date.
)

:: ── Step 7: Launch dev server in a new window ───────────────────
echo.
echo  [START] Launching NIDARSHAN dev server...
echo          The app will open at: http://localhost:3000
echo.
echo  ┌─────────────────────────────────────────────────┐
echo  │  A new terminal window will open with the server │
echo  │  Press Ctrl+C in that window to stop the server  │
echo  └─────────────────────────────────────────────────┘
echo.

:: Start server in a new, titled cmd window — keeps this launcher window clean
start "NIDARSHAN Server" cmd /k "title NIDARSHAN Server && set PATH=%APPDATA%\npm;%PATH% && echo. && echo  Server starting — open http://localhost:3000 && echo  Press Ctrl+C to stop. && echo. && %PNPM_CMD% dev"

:: ── Step 8: Open browser after a short delay ────────────────────
echo  [INFO] Waiting for server to start...
timeout /t 6 /nobreak >nul
start "" "http://localhost:3000"
echo  [OK] Browser opened.

echo.
echo  ════════════════════════════════════════════════════
echo   NIDARSHAN is running.
echo   Server window: "NIDARSHAN Server" in your taskbar.
echo   To stop: close the server window or press Ctrl+C.
echo  ════════════════════════════════════════════════════
echo.
pause
endlocal
