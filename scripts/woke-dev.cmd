@echo off
rem Dev preview launcher, see woke-dev.ps1 next to this file.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0woke-dev.ps1" %*
set WOKE_DEV_EXIT=%ERRORLEVEL%
rem Leave a double-clicked window open long enough to read.
if "%~1"=="" timeout /t 8 >nul 2>&1
exit /b %WOKE_DEV_EXIT%
