#!/bin/bash
# =============================================================================
# TWENTY2CRM - Automatic Backup Script
# =============================================================================
# Purpose: Daily database backup with 30 backups retention
# =============================================================================

# Settings
BACKUP_DIR=~/CRM-Backups
SOURCE_DB=./crm-app/prisma/dev.db
DATE=$(date +%Y-%m-%d_%H-%M)
BACKUP_FILE="$BACKUP_DIR/CRM-Backup_$DATE.db"
LOG_FILE="$BACKUP_DIR/backup-log.txt"

# Create backup directory if it doesn't exist
if [ ! -d "$BACKUP_DIR" ]; then
    echo "📁 Creating backup directory..."
    mkdir -p "$BACKUP_DIR"
fi

# Check if database file exists
if [ ! -f "$SOURCE_DB" ]; then
    ERROR_MSG="❌ ERROR: Database file not found at $SOURCE_DB"
    echo "$ERROR_MSG"
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $ERROR_MSG" >> "$LOG_FILE"
    exit 1
fi

# Backup the database
echo "💾 Backing up database..."
cp "$SOURCE_DB" "$BACKUP_FILE"

# Verify backup
if [ -f "$BACKUP_FILE" ]; then
    FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "✅ Backup completed successfully!"
    echo "📄 File: $BACKUP_FILE"
    echo "📊 Size: $FILE_SIZE"
    
    # Log success
    echo "$(date '+%Y-%m-%d %H:%M:%S') - ✅ Backup successful: $BACKUP_FILE ($FILE_SIZE)" >> "$LOG_FILE"
else
    ERROR_MSG="❌ ERROR: Backup file was not created"
    echo "$ERROR_MSG"
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $ERROR_MSG" >> "$LOG_FILE"
    exit 1
fi

# Clean old backups - keep last 30
echo "🧹 Cleaning old backups..."
OLD_BACKUPS=$(ls -t "$BACKUP_DIR"/CRM-Backup_*.db 2>/dev/null | tail -n +31)

if [ -n "$OLD_BACKUPS" ]; then
    echo "$OLD_BACKUPS" | xargs rm -f
    DELETED_COUNT=$(echo "$OLD_BACKUPS" | wc -l)
    echo "✅ Deleted $DELETED_COUNT old backups"
else
    echo "✅ No old backups to delete"
fi

# Summary
TOTAL_BACKUPS=$(ls "$BACKUP_DIR"/CRM-Backup_*.db 2>/dev/null | wc -l)
echo ""
echo "📊 Summary:"
echo "   Total backups: $TOTAL_BACKUPS"
echo "   Backup directory: $BACKUP_DIR"
echo ""
echo "🎉 Backup completed successfully!"
