@echo off
setlocal
cd /d "%~dp0"

set "NODE_BIN=C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"
set "PNPM=C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\pnpm.cmd"
set "PATH=%NODE_BIN%;%PATH%"

powershell -NoProfile -Command "if (Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }" >nul 2>nul
if not errorlevel 1 (
  start "" "http://127.0.0.1:5173/"
  exit /b 0
)

where node >nul 2>nul
if errorlevel 1 (
  echo Cannot find Node.js runtime.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Installing app dependencies...
  call "%PNPM%" install
  if errorlevel 1 (
    echo Install failed.
    pause
    exit /b 1
  )
)

start "" "http://127.0.0.1:5173/"
call "%PNPM%" dev
