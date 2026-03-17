@echo off
REM ============================================
REM התקנת Task Scheduler לסנכרון אוטומטי יומי
REM מריץ סנכרון כל יום בשעה 06:00 בבוקר
REM ============================================

echo.
echo ============================================
echo   Twenty2Jobs - הגדרת סנכרון אוטומטי
echo ============================================
echo.

REM מחיקת משימה קיימת אם יש
schtasks /delete /tn "Twenty2Jobs-AutoSync" /f 2>nul

REM יצירת משימה חדשה - כל יום בשעה 06:00
schtasks /create /tn "Twenty2Jobs-AutoSync" /tr "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File \"%~dp0auto-sync-website.ps1\"" /sc daily /st 06:00 /ru "%USERNAME%" /rl HIGHEST /f

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ המשימה הותקנה בהצלחה!
    echo.
    echo 📅 הסנכרון יפעל אוטומטית כל יום בשעה 06:00
    echo.
    echo להפעלה ידנית: לחץ פעמיים על "סנכרן-לאתר.bat"
    echo.
) else (
    echo.
    echo ❌ שגיאה בהתקנת המשימה
    echo    נסה להריץ כמנהל (Run as Administrator)
    echo.
)

echo.
pause
