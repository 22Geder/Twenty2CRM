@echo off
chcp 65001 > nul
title Twenty2CRM - הפעלת מערכת

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    Twenty22Jobs CRM                         ║
echo ║              המרכז לעובדים ולמעסיקים בישראל                  ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

:: גיבוי אוטומטי לפני הפעלה
echo 📦 מבצע גיבוי אוטומטי...
powershell -ExecutionPolicy Bypass -File "%~dp0auto-backup.ps1"

echo.
echo 🚀 מפעיל את המערכת...
echo.
echo    כתובת מקומית:  http://localhost:3000
echo    כתובת רשת:     http://10.0.0.2:3000
echo.
echo ⚠️  אל תסגור חלון זה! המערכת תכבה.
echo    לחץ Ctrl+C לעצירה.
echo.

cd /d "%~dp0crm-app"
npm run dev

pause
