# 🔄 Twenty2Jobs - CRM Sync System
## מערכת סנכרון בין TWENTY2CRM ל-Twenty2Jobs

---

## 📋 סקירה כללית

מערכת זו מאפשרת **סנכרון דו-כיווני** של משרות בין ה-CRM לאתר Twenty2Jobs:
- כשאתה מעדכן משרה ב-CRM → היא מתעדכנת אוטומטית באתר
- כשאתה משבית משרה ב-CRM → היא מושבתת גם באתר

---

## 🚀 הפעלה מהירה

### 1. הגדרת Environment Variables

**ב-CRM (.env):**
```env
# URL של אתר Twenty2Jobs
TWENTY2JOBS_URL=https://hr22group.com

# מפתח API לסנכרון (חייב להיות זהה בשני הצדדים)
TWENTY2JOBS_SYNC_API_KEY=twenty2jobs-crm-sync-2026

# הפעלת סנכרון אוטומטי (true/false)
TWENTY2JOBS_AUTO_SYNC=true
```

**באתר Twenty2Jobs (.env):**
```env
# מפתח API לסנכרון (חייב להיות זהה ל-CRM)
SYNC_API_KEY=twenty2jobs-crm-sync-2026
```

---

## 📡 API Endpoints

### באתר Twenty2Jobs (Django)

| Endpoint | Method | תיאור |
|----------|--------|-------|
| `/api/sync/position/` | POST | סנכרון משרה בודדת |
| `/api/sync/positions/bulk/` | POST | סנכרון מרובה של משרות |
| `/api/sync/position/deactivate/` | POST | השבתת משרה |
| `/api/sync/status/` | GET | בדיקת סטטוס החיבור |
| `/api/sync/positions/` | GET | רשימת משרות מסונכרנות |

### ב-CRM (Next.js)

| Endpoint | Method | תיאור |
|----------|--------|-------|
| `/api/sync-to-website` | GET | בדיקת חיבור לאתר |
| `/api/sync-to-website` | POST | ביצוע סנכרון |

---

## 🔧 שימוש ב-API

### סנכרון משרה בודדת

```javascript
// מה-CRM
POST /api/sync-to-website
{
  "action": "single",
  "positionId": "uuid-of-position"
}
```

### סנכרון כל המשרות הפעילות

```javascript
POST /api/sync-to-website
{
  "action": "all",
  "onlyActive": true  // ברירת מחדל
}
```

### סנכרון משרות של מעסיק

```javascript
POST /api/sync-to-website
{
  "action": "employer",
  "employerId": "uuid-of-employer"
}
```

### השבתת משרה

```javascript
POST /api/sync-to-website
{
  "action": "deactivate",
  "positionId": "uuid-of-position"
}
```

### בדיקת סטטוס

```javascript
GET /api/sync-to-website?action=status
```

---

## 🔄 סנכרון אוטומטי

כשמוגדר `TWENTY2JOBS_AUTO_SYNC=true`:

1. **יצירת משרה חדשה** - אם המשרה פעילה, תסונכרן אוטומטית
2. **עדכון משרה** - המשרה תסונכרן אוטומטית
3. **השבתת משרה** - המשרה תושבת גם באתר

---

## 🗺️ מיפוי שדות

| שדה ב-CRM | שדה באתר |
|-----------|----------|
| `id` | `crm_id` (בתגיות) |
| `title` | `display_title`, `title` |
| `description` + `requirements` + `benefits` + `workHours` | `description` |
| `location` | `city` |
| `employmentType` | `job_type` |
| `active` | `is_active` |
| `openings` | `positions_available` |
| `keywords` | `tags` |
| `employer.name` | `company_name` |

---

## 🏷️ מיפוי קטגוריות

| קטגוריה ב-CRM | קטגוריה באתר |
|---------------|--------------|
| היי-טק ופיתוח | `hitech` |
| פיננסים וכספים / בנקאות | `finance` |
| שיווק ומכירות | `sales` / `marketing` |
| לוגיסטיקה ותפעול | `logistics` |
| רכב ומוסכים | `auto` |
| בנייה והנדסה | `engineering` |
| רפואה ובריאות | `medical` |
| חינוך והוראה | `education` |
| מסעדנות ואירוח | `food` |
| שמירה ואבטחה | `security` |
| משאבי אנוש | `admin` |

---

## 🛠️ פתרון בעיות

### הסנכרון לא עובד

1. **בדוק את ה-API Key** - חייב להיות זהה בשני הצדדים
2. **בדוק את ה-URL** - וודא שהוא נכון ונגיש
3. **בדוק לוגים** - הודעות שגיאה מופיעות ב-console

### בדיקת חיבור

```bash
# מה-CRM
curl -X GET "https://hr22group.com/api/sync/status/" \
  -H "X-API-Key: twenty2jobs-crm-sync-2026"
```

### סנכרון ידני

```typescript
import { syncAllPositions } from '@/lib/twenty2jobs-sync'

// סנכרון כל המשרות
const result = await syncAllPositions()
console.log(result)
```

---

## 📊 מעקב

כל משרה מסונכרנת מקבלת תגית `crm_id:{uuid}` שמאפשרת:
- זיהוי משרות שמגיעות מה-CRM
- עדכון משרות קיימות במקום יצירה כפולה
- מעקב אחרי סטטוס הסנכרון

---

## 🔒 אבטחה

- כל הקריאות דורשות **API Key** בכותרת
- ה-API Key נשמר כ-Environment Variable (לא בקוד)
- רק משתמשים מחוברים ב-CRM יכולים להפעיל סנכרון

---

## 📝 דוגמת קוד

### סנכרון מתוך קומפוננט React

```tsx
import { useState } from 'react'

export function SyncButton({ positionId }: { positionId: string }) {
  const [syncing, setSyncing] = useState(false)
  
  const handleSync = async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/sync-to-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'single', positionId })
      })
      const data = await res.json()
      
      if (data.success) {
        alert(`✅ המשרה סונכרנה בהצלחה! (${data.action})`)
      } else {
        alert(`❌ שגיאה: ${data.error}`)
      }
    } finally {
      setSyncing(false)
    }
  }
  
  return (
    <button onClick={handleSync} disabled={syncing}>
      {syncing ? '🔄 מסנכרן...' : '🔄 סנכרן לאתר'}
    </button>
  )
}
```

### סנכרון כל המשרות

```tsx
export function SyncAllButton() {
  const handleSyncAll = async () => {
    const res = await fetch('/api/sync-to-website', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'all' })
    })
    const data = await res.json()
    
    if (data.success) {
      alert(`✅ סנכרון הושלם!\n${data.results.created} נוצרו\n${data.results.updated} עודכנו`)
    }
  }
  
  return <button onClick={handleSyncAll}>🔄 סנכרן הכל לאתר</button>
}
```

---

## 🎉 סיכום

המערכת מאפשרת לך לנהל את כל המשרות ב-**מקום אחד** (ה-CRM) וה��ן מתעדכנות אוטומטית גם באתר!

לשאלות או תמיכה: support@twenty2jobs.com
