# =============================================================================
# TWENTY2CRM - סקריפט גיבוי אוטומטי
# =============================================================================
# מטרה: גיבוי יומי של בסיס הנתונים עם שמירת 30 גיבויים אחרונים
# =============================================================================

# הגדרות
$backupDir = "C:\CRM-Backups"
$sourceDb = ".\crm-app\prisma\dev.db"
$date = Get-Date -Format "yyyy-MM-dd_HH-mm"
$backupFile = "$backupDir\CRM-Backup_$date.db"
$logFile = "$backupDir\backup-log.txt"

# צור תיקיית גיבויים אם לא קיימת
if (-not (Test-Path $backupDir)) {
    Write-Host "📁 יוצר תיקיית גיבויים..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $backupDir | Out-Null
}

# בדוק שקובץ ה-DB קיים
if (-not (Test-Path $sourceDb)) {
    $errorMsg = "❌ ERROR: Database file not found at $sourceDb"
    Write-Host $errorMsg -ForegroundColor Red
    Add-Content $logFile "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - $errorMsg"
    exit 1
}

try {
    # גבה את ה-DB
    Write-Host "💾 מגבה את בסיס הנתונים..." -ForegroundColor Cyan
    Copy-Item $sourceDb $backupFile -Force
    
    # בדוק שהגיבוי הצליח
    if (Test-Path $backupFile) {
        $fileSize = (Get-Item $backupFile).Length / 1KB
        $fileSizeFormatted = "{0:N2} KB" -f $fileSize
        
        Write-Host "✅ הגיבוי הושלם בהצלחה!" -ForegroundColor Green
        Write-Host "📄 קובץ: $backupFile" -ForegroundColor White
        Write-Host "📊 גודל: $fileSizeFormatted" -ForegroundColor White
        
        # רשום ללוג
        $logMsg = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - ✅ Backup successful: $backupFile ($fileSizeFormatted)"
        Add-Content $logFile $logMsg
    } else {
        throw "Backup file was not created"
    }
    
    # נקה גיבויים ישנים - שמור רק 30 אחרונים
    Write-Host "🧹 מנקה גיבויים ישנים..." -ForegroundColor Yellow
    $oldBackups = Get-ChildItem $backupDir -Filter "CRM-Backup_*.db" | 
        Sort-Object CreationTime -Descending | 
        Select-Object -Skip 30
    
    if ($oldBackups) {
        $oldBackups | ForEach-Object {
            Remove-Item $_.FullName -Force
            Write-Host "  🗑️  נמחק: $($_.Name)" -ForegroundColor Gray
        }
        Write-Host "✅ נמחקו $($oldBackups.Count) גיבויים ישנים" -ForegroundColor Green
    } else {
        Write-Host "✅ אין גיבויים ישנים למחיקה" -ForegroundColor Green
    }
    
    # הצג סיכום
    $totalBackups = (Get-ChildItem $backupDir -Filter "CRM-Backup_*.db").Count
    Write-Host "`n📊 סיכום:" -ForegroundColor Cyan
    Write-Host "   סה`"כ גיבויים: $totalBackups" -ForegroundColor White
    Write-Host "   תיקיית גיבויים: $backupDir" -ForegroundColor White
    
} catch {
    $errorMsg = "❌ ERROR: $($_.Exception.Message)"
    Write-Host $errorMsg -ForegroundColor Red
    Add-Content $logFile "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - $errorMsg"
    exit 1
}

Write-Host "`n🎉 הגיבוי הושלם בהצלחה!" -ForegroundColor Green
