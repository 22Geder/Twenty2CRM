# ========================================
# הגדרת Twenty2CRM לרשת משרדית
# הרץ כמנהל (Run as Administrator)
# ========================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   הגדרת Twenty2CRM לרשת המשרדית" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# בדיקה שרץ כמנהל
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "שגיאה: יש להריץ את הסקריפט כמנהל!" -ForegroundColor Red
    Write-Host "לחץ קליק ימני -> Run as Administrator" -ForegroundColor Yellow
    pause
    exit 1
}

# הגדרת נתיבים
$dataPath = "C:\Twenty2CRM-Data"
$uploadsPath = "$dataPath\uploads"
$backupsPath = "$dataPath\backups"
$databasePath = "$dataPath\database.db"

Write-Host "שלב 1: יצירת תיקיות אחסון..." -ForegroundColor Green

# יצירת תיקיות
$folders = @(
    $dataPath,
    $uploadsPath,
    "$uploadsPath\resumes",
    "$uploadsPath\candidates",
    "$uploadsPath\images",
    $backupsPath
)

foreach ($folder in $folders) {
    if (-not (Test-Path $folder)) {
        New-Item -ItemType Directory -Force -Path $folder | Out-Null
        Write-Host "  נוצרה תיקייה: $folder" -ForegroundColor Gray
    } else {
        Write-Host "  קיימת: $folder" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "שלב 2: הגדרת הרשאות..." -ForegroundColor Green
icacls $dataPath /grant:r "Everyone:(OI)(CI)F" /T /Q
Write-Host "  הרשאות הוגדרו בהצלחה" -ForegroundColor Gray

Write-Host ""
Write-Host "שלב 3: פתיחת פורט בחומת האש..." -ForegroundColor Green
$existingRule = Get-NetFirewallRule -DisplayName "Twenty2CRM" -ErrorAction SilentlyContinue
if (-not $existingRule) {
    New-NetFirewallRule -DisplayName "Twenty2CRM" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow | Out-Null
    Write-Host "  פורט 3000 נפתח בהצלחה" -ForegroundColor Gray
} else {
    Write-Host "  פורט 3000 כבר פתוח" -ForegroundColor Gray
}

Write-Host ""
Write-Host "שלב 4: גילוי כתובת IP..." -ForegroundColor Green
$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" } | Select-Object -First 1).IPAddress
if ($ipAddress) {
    Write-Host "  כתובת ה-IP שלך ברשת: $ipAddress" -ForegroundColor Yellow
} else {
    Write-Host "  לא נמצאה כתובת IP ברשת המקומית" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   ההגדרה הושלמה בהצלחה!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "מה עכשיו?" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. ערוך את קובץ .env ושנה:" -ForegroundColor White
Write-Host "   DATABASE_URL=`"file:$databasePath`"" -ForegroundColor Yellow
Write-Host "   UPLOADS_PATH=`"$uploadsPath`"" -ForegroundColor Yellow
Write-Host "   NEXTAUTH_URL=`"http://${ipAddress}:3000`"" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. הרץ את prisma migrate:" -ForegroundColor White
Write-Host "   npx prisma migrate deploy" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. הפעל את השרת:" -ForegroundColor White
Write-Host "   npm run dev -- -H 0.0.0.0" -ForegroundColor Yellow
Write-Host ""
Write-Host "4. גישה מהרשת:" -ForegroundColor White
Write-Host "   http://${ipAddress}:3000" -ForegroundColor Yellow
Write-Host ""
Write-Host "הקבצים יישמרו ב: $uploadsPath" -ForegroundColor Magenta
Write-Host "בסיס הנתונים: $databasePath" -ForegroundColor Magenta
Write-Host ""
pause
