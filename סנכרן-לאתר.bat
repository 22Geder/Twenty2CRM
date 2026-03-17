@echo off
REM ============================================
REM Twenty2Jobs - Auto Sync to Website
REM הפעל קובץ זה לסנכרון מיידי של כל המשרות
REM ============================================

echo.
echo ============================================
echo    Twenty2Jobs - Website Sync
echo ============================================
echo.

REM הפעלת הסקריפט
powershell.exe -ExecutionPolicy Bypass -File "%~dp0auto-sync-website.ps1"

echo.
echo ============================================
echo    סיום - לחץ מקש כלשהו לסגירה
echo ============================================
pause > nul
