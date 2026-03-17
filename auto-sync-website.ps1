# ============================================
# 🔄 Twenty2Jobs - Daily Auto Sync Script
# ============================================
# סקריפט זה מסנכרן את כל המשרות מה-CRM לאתר
# מופעל אוטומטית כל יום בשעה 06:00
# ============================================

$ErrorActionPreference = "Continue"
$LogFile = "C:\Twenty2CRM-Data\logs\sync-$(Get-Date -Format 'yyyy-MM-dd').log"

# יצירת תיקיית לוגים אם לא קיימת
$LogDir = Split-Path $LogFile -Parent
if (!(Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] $Message"
    Add-Content -Path $LogFile -Value $logMessage
    Write-Host $logMessage
}

Write-Log "============================================"
Write-Log "🔄 מתחיל סנכרון יומי לאתר Twenty2Jobs"
Write-Log "============================================"

# הגדרות
$CRM_URL = "http://localhost:3000"
$CRON_SECRET = "twenty2-cron-2026"

try {
    # בדיקה שה-CRM רץ
    Write-Log "📡 בודק חיבור ל-CRM..."
    
    $response = Invoke-RestMethod -Uri "$CRM_URL/api/cron/sync-website" `
        -Method GET `
        -Headers @{ "X-Cron-Secret" = $CRON_SECRET } `
        -TimeoutSec 300 `
        -ErrorAction Stop

    if ($response.success) {
        Write-Log "✅ סנכרון הושלם בהצלחה!"
        Write-Log "   📊 סטטיסטיקות:"
        Write-Log "      - סה״כ משרות: $($response.stats.total)"
        Write-Log "      - נוצרו: $($response.stats.created)"
        Write-Log "      - עודכנו: $($response.stats.updated)"
        Write-Log "      - נכשלו: $($response.stats.failed)"
        Write-Log "   ⏱️ זמן: $($response.duration)ms"
    } else {
        Write-Log "❌ הסנכרון נכשל: $($response.error)"
    }

} catch {
    Write-Log "❌ שגיאה בסנכרון: $($_.Exception.Message)"
    
    # אם ה-CRM לא רץ, ננסה להפעיל אותו
    Write-Log "🔄 מנסה להפעיל את ה-CRM..."
    
    $CRM_PATH = "C:\One Drive 22GETHER\OneDrive\Desktop\TWENTY2CRM\crm-app"
    
    if (Test-Path $CRM_PATH) {
        Start-Process -FilePath "cmd.exe" `
            -ArgumentList "/c cd /d `"$CRM_PATH`" && npm run dev" `
            -WindowStyle Hidden
        
        Write-Log "⏳ ממתין 30 שניות להפעלת ה-CRM..."
        Start-Sleep -Seconds 30
        
        # ניסיון נוסף
        try {
            $response = Invoke-RestMethod -Uri "$CRM_URL/api/cron/sync-website" `
                -Method GET `
                -Headers @{ "X-Cron-Secret" = $CRON_SECRET } `
                -TimeoutSec 300 `
                -ErrorAction Stop

            if ($response.success) {
                Write-Log "✅ סנכרון הושלם בהצלחה (ניסיון שני)!"
            }
        } catch {
            Write-Log "❌ הסנכרון נכשל גם בניסיון השני: $($_.Exception.Message)"
        }
    }
}

Write-Log "============================================"
Write-Log "🏁 סיום סקריפט סנכרון"
Write-Log "============================================"
Write-Log ""
