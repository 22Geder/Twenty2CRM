# Twenty2CRM Auto Backup Script
$sourceDB = "C:\Twenty2CRM-Data\database.db"
$backupFolder = "C:\Twenty2CRM-Data\backups"
$date = Get-Date -Format "yyyy-MM-dd_HH-mm"
$backupFile = "$backupFolder\database_$date.db"

if (-not (Test-Path $backupFolder)) {
    New-Item -ItemType Directory -Path $backupFolder -Force | Out-Null
    Write-Host "Backup folder created: $backupFolder" -ForegroundColor Green
}

if (Test-Path $sourceDB) {
    Copy-Item $sourceDB $backupFile -Force
    Write-Host "Backup created: $backupFile" -ForegroundColor Green
    
    $oldBackups = Get-ChildItem $backupFolder -Filter "database_*.db" | Sort-Object CreationTime -Descending | Select-Object -Skip 7
    if ($oldBackups) {
        $oldBackups | Remove-Item -Force
        Write-Host "Deleted $($oldBackups.Count) old backups" -ForegroundColor Yellow
    }
    
    Write-Host "Existing backups:" -ForegroundColor Cyan
    Get-ChildItem $backupFolder -Filter "database_*.db" | Sort-Object CreationTime -Descending | ForEach-Object { Write-Host "  $($_.Name)" }
} else {
    Write-Host "Database not found: $sourceDB" -ForegroundColor Red
}

Write-Host "Backup complete!" -ForegroundColor Green
