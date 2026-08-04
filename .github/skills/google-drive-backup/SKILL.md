# SKILL: Google Drive Backup — TWENTY2CRM

## מתי להשתמש בסקיל הזה
- גיבוי נכשל / לא רץ אוטומטי
- שחזור לא עובד / נתונים חסרים אחרי restore
- Service account שגיאה
- קבצים לא נמצאים ב-Drive
- `/api/backup` מחזיר שגיאה
- `/api/restore` זורק exception

## קבצים רלוונטיים
```
crm-app/src/lib/google-drive.ts              ← חיבור ל-Drive API
crm-app/src/app/api/backup/route.ts          ← יצוא נתונים
crm-app/src/app/api/restore/route.ts         ← שחזור נתונים
crm-app/src/components/drive-backup-manager.tsx ← ממשק גיבוי
crm-app/src/app/dashboard/backup-rescue/     ← דף גיבוי ושחזור
crm-app/service-account-key.json             ← ⚠️ לא לגעת / לא לפרסם
crm-app/src/lib/storage-config.ts            ← הגדרות storage
```

## משתני סביבה נדרשים
```
GOOGLE_DRIVE_FOLDER_ID      ← ID של תיקיית Drive לגיבויים
GOOGLE_SERVICE_ACCOUNT_KEY  ← JSON content של service-account-key.json
                              (ב-Railway: כל ה-JSON כ-string אחד)
```

## צ'קליסט דיאגנוסטי (לפי סדר)

### שלב 1: בדוק service account
```typescript
// ב-google-drive.ts - הקובץ טוען את ה-credentials:
// 1. מ-GOOGLE_SERVICE_ACCOUNT_KEY (env var - פרודקשן)
// 2. מ-service-account-key.json (קובץ - local dev)
// אם שניהם חסרים → Drive לא עובד
```

### שלב 2: בדוק הרשאות Drive
- Service account חייב להיות מוסף לתיקיית Drive כ-Editor
- Folder ID נמצא ב-URL: `drive.google.com/drive/folders/{FOLDER_ID}`

### שלב 3: בדוק backup אחרון
```
GET /api/backup
← מחזיר JSON עם כל הנתונים
← שמור ל-Drive ידנית אם אוטומטי נכשל
```

### שלב 4: לפני restore
- ⚠️ **RESTORE מחליף נתונים קיימים** - בדוק שיש גיבוי עדכני
- קרא את ה-README ב-`dashboard/backup-rescue` לפני שחזור

## בעיות שכיחות ופתרונות

### 1. "Service account key not found"
- בדוק ש-`GOOGLE_SERVICE_ACCOUNT_KEY` מוגדר ב-Railway
- הכנס את כל ה-JSON content כ-string אחד (עם גרשיים בורחים)

### 2. "Insufficient permissions" ל-Drive
- הוסף את ה-service account email לתיקיית Drive
- email נמצא ב-service-account-key.json → `"client_email"`

### 3. Backup קטן מדי / חסרים נתונים
- בדוק ב-`backup/route.ts` שכל המודלים מופיעים ב-`Promise.all`
- אם הוספת model חדש ל-schema → הוסף אותו גם ל-backup

### 4. Restore נכשל באמצע
- Restore רץ ב-transaction → אם נכשל, הכל rollback
- בדוק שגרסת ה-schema תואמת לגרסת הגיבוי

## כללים חשובים
- ❌ לא לפרסם / לשתף `service-account-key.json`
- ❌ לא להריץ restore בפרודקשן בלי אישור מפורש
- ❌ לא למחוק גיבויים ישנים מ-Drive לפני שיש חדשים
- ✅ לגבות לפני כל שינוי גדול ב-schema
- ✅ גיבוי אחרי כל הוספה גדולה של נתונים
