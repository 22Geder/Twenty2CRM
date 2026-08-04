---
name: reporting-analytics
description: "Build and fix reports, analytics, and exports in TWENTY2CRM. Use when: dashboard stats wrong, reports empty, export to Excel/CSV fails, activity log not recording, charts not loading, KPI calculations incorrect. Triggers: 'דוח לא עובד', 'stats wrong', 'export fails', 'activity log', 'ייצוא נתונים', 'דשבורד שגוי', 'chart broken', 'KPI שגוי'."
argument-hint: "Describe which report or stat is not working"
---

# Reporting & Analytics Skill — TWENTY2CRM

## When to Use
- Dashboard counters מציגים מספרים שגויים
- Export ל-Excel/CSV נכשל
- לוג פעולות לא מתעדכן
- גרפים / charts לא נטענים
- `/api/reports/stats` מחזיר שגיאה

## Files Map
```
crm-app/src/app/api/reports/stats/route.ts    ← KPI ראשי
crm-app/src/app/api/activity-logs/route.ts   ← לוג פעולות
crm-app/src/app/api/export-positions/route.ts ← ייצוא משרות
crm-app/src/app/dashboard/reports/           ← ממשק דוחות
crm-app/src/components/dashboard-stats.tsx   ← קומפוננט stats
crm-app/src/components/activity-feed.tsx     ← קומפוננט לוג
```

## KPIs במערכת

| KPI | חישוב |
|-----|--------|
| סה"כ מועמדים | `COUNT(candidates)` |
| מועמדים החודש | `COUNT WHERE createdAt >= startOfMonth` |
| מועמדים מומשים | `COUNT WHERE status = 'HIRED'` |
| ראיונות מתוכננים | `COUNT WHERE status = 'SCHEDULED'` |
| משרות פעילות | `COUNT WHERE active = true` |
| זמן ממוצע גיוס | `AVG(hiredAt - createdAt)` |

## Diagnostic Procedure

### שלב 1: בדוק endpoint
```
GET /api/reports/stats
← 500 → בדוק שגיאת Prisma ב-logs
← ריק → בדוק WHERE conditions
← מספרים שגויים → בדוק timezone (Israel = UTC+3)
```

### שלב 2: Timezone
```typescript
// שגיאה נפוצה: UTC vs Israel (UTC+3)
const startOfMonth = new Date(year, month, 1) // Local time
```

### שלב 3: Activity Log
```typescript
// כל פעולה חשובה צריכה לרשום:
await prisma.activityLog.create({
  data: {
    action: "CANDIDATE_CREATED",
    entityType: "Candidate",
    entityId: candidate.id,
    userId: session.user.id
  }
})
// ⚠️ wrap בנפרד: try { await log() } catch {}
// כשל ב-log לא ישבור את הaction הראשי!
```

### שלב 4: Export
```
GET /api/export-positions
← בדוק Content-Type: application/vnd.openxmlformats...
← בדוק Content-Disposition: attachment; filename="export.xlsx"
← קובץ ריק → בדוק שה-query מחזיר נתונים
```

## בעיות נפוצות

### 1. Stats מציג 0
```typescript
const count = await prisma.candidate.count({ where: { status: 'ACTIVE' } })
// אם 0 → בדוק שה-enum name תואם ל-schema
```

### 2. Export שבור
- `res.send(buffer)` ולא `res.json(buffer)`
- בדוק שexceljs מותקן

### 3. Chart לא מציג נתונים
- בדוק שה-API מחזיר array (לא null)
- date format: `YYYY-MM-DD`

## Activity Types
```typescript
"CANDIDATE_CREATED" | "CANDIDATE_UPDATED" | "CANDIDATE_HIRED"
"POSITION_CREATED" | "POSITION_CLOSED"
"INTERVIEW_SCHEDULED" | "INTERVIEW_COMPLETED"
"CV_UPLOADED" | "SMS_SENT" | "EMAIL_SENT"
"BACKUP_CREATED" | "USER_LOGIN"
```

## כללים חשובים
- ❌ לא לחשב stats ב-client — תמיד server-side
- ✅ Activity Log לא לשבור flow ראשי אם נכשל
- ✅ cache stats (5 דקות) אם חוזרים הרבה
- ✅ כל export: Content-Type + Content-Disposition חובה
