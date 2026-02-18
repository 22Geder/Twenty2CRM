# 📦 מדריך גיבוי אוטומטי - Twenty2CRM

## 🎯 סקירה כללית

מערכת הגיבוי מבטיחה שכל הנתונים נשמרים באופן אוטומטי כל 24 שעות ולעולם לא יאבדו.

## 🔐 מה נשמר בגיבוי?

| סוג נתונים | תיאור |
|------------|-------|
| 👥 מועמדים | כל פרטי המועמדים, קורות חיים, הערות |
| 🏢 מעסיקים | פרטי חברות ואנשי קשר |
| 💼 משרות | כל המשרות הפעילות והסגורות |
| 📝 מועמדויות | היסטוריית הגשות וסטטוסים |
| 🏷️ תגיות | כל התגיות והקטגוריות |
| 📧 תקשורת | מיילים, SMS, שיחות |
| 📅 ראיונות | כל הראיונות והמשובים |
| 📄 מסמכים | רשימת כל המסמכים שהועלו |

---

## 🚀 דרכי הפעלה

### 1. גיבוי ידני (הורדת קובץ)

```
GET https://YOUR-APP.railway.app/api/backup
```

פתח בדפדפן או הפעל:
```bash
curl -o backup.json https://YOUR-APP.railway.app/api/backup
```

### 2. גיבוי אוטומטי (Cron Job)

**הגדרה ב-cron-job.org (חינם):**

1. הירשם ב-[cron-job.org](https://cron-job.org)
2. צור Job חדש:
   - **URL:** `https://YOUR-APP.railway.app/api/cron/backup?secret=twenty2crm-backup-2024`
   - **Schedule:** `0 3 * * *` (כל יום בשעה 03:00)
   - **Method:** GET
3. הפעל ושמור

**אפשרויות נוספות:**
- [Easycron](https://www.easycron.com/) - חינם עד 200 הפעלות/חודש
- [UptimeRobot](https://uptimerobot.com/) - עם פיצ'ר cron
- GitHub Actions - ראה להלן

---

## 🤖 GitHub Actions - גיבוי אוטומטי

צור קובץ `.github/workflows/backup.yml`:

```yaml
name: Daily Backup

on:
  schedule:
    - cron: '0 3 * * *'  # כל יום בשעה 03:00 UTC
  workflow_dispatch:  # אפשר הפעלה ידנית

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Backup
        run: |
          curl -X GET "https://YOUR-APP.railway.app/api/cron/backup?secret=twenty2crm-backup-2024"
          
      - name: Download Full Backup
        run: |
          curl -o backup-$(date +%Y-%m-%d).json "https://YOUR-APP.railway.app/api/backup"
          
      - name: Upload Backup Artifact
        uses: actions/upload-artifact@v4
        with:
          name: crm-backup-${{ github.run_number }}
          path: backup-*.json
          retention-days: 30
```

---

## 📊 API Endpoints

| Endpoint | Method | תיאור |
|----------|--------|-------|
| `/api/backup` | GET | הורדת גיבוי מלא כ-JSON |
| `/api/backup` | POST | סיכום מהיר של הנתונים |
| `/api/cron/backup` | GET/POST | הפעלת גיבוי אוטומטי (עם secret) |
| `/api/restore` | POST | שחזור נתונים (רק למנהלים) |

---

## 🔑 אבטחה

### משתני סביבה

הוסף ל-Railway:
```
CRON_SECRET=twenty2crm-backup-2024
```

החלף את הסוד לערך ייחודי משלך!

---

## 📁 מבנה קובץ הגיבוי

```json
{
  "metadata": {
    "version": "2.0",
    "createdAt": "2026-02-18T10:30:00.000Z",
    "source": "Twenty2CRM",
    "counts": {
      "candidates": 150,
      "employers": 12,
      "positions": 45,
      "applications": 89,
      "tags": 25
    }
  },
  "data": {
    "candidates": [...],
    "employers": [...],
    "positions": [...],
    "applications": [...],
    "tags": [...],
    "notes": [...],
    "interviews": [...],
    "communications": [...]
  }
}
```

---

## 🛡️ שחזור נתונים

במקרה של בעיה, השתמש ב-endpoint הקיים:

```
POST /api/restore
```

זה ישחזר את כל המעסיקים, המשרות, התגיות והמחלקות.

---

## ⚠️ טיפים חשובים

1. **אל תמחק גיבויים** - שמור לפחות 30 יום אחורה
2. **בדוק שהגיבוי עובד** - הפעל ידנית פעם בשבוע
3. **שמור גיבויים מחוץ לשרת** - הורד לדיסק מקומי או cloud
4. **הגן על ה-Secret** - אל תחשוף את ה-CRON_SECRET

---

## 📞 תמיכה

אם יש בעיה עם הגיבוי, בדוק:
1. הלוגים ב-Railway Dashboard
2. ש-DATABASE_URL מוגדר נכון
3. שהסוד תואם

**הסבר למשתמש:** לעולם לא יאבדו נתונים! המערכת מגבה אוטומטית כל 24 שעות.
