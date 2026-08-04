---
name: interviews-attendance
description: "Manage interviews and attendance tracking in TWENTY2CRM. Use when: interview not scheduled, reminders not sent, attendance clock-in/out broken, holiday calendar wrong, interview status not updating. Triggers: 'ראיון לא נשמר', 'תזכורת לא נשלחה', 'נוכחות שגויה', 'שעון נוכחות', 'interview broken', 'reminder failed', 'attendance error', 'clock-in לא עובד'."
argument-hint: "Describe the interview or attendance issue"
---

# Interviews & Attendance Skill — TWENTY2CRM

## When to Use
- ראיון לא נשמר / לא מופיע
- תזכורת SMS/Email לא נשלחה
- Clock-in / Clock-out לא עובד
- ימי חג לא מוגדרים
- סטטוס ראיון לא מתעדכן

## Files Map — ראיונות
```
crm-app/src/app/api/interviews/route.ts           ← CRUD
crm-app/src/app/api/interviews/[id]/route.ts      ← ראיון בודד
crm-app/src/app/api/interview-reminders/route.ts  ← תזכורות
crm-app/src/app/dashboard/interviews/             ← ממשק
crm-app/src/components/interview-scheduler.tsx
```

## Files Map — נוכחות
```
crm-app/src/app/api/attendance/route.ts
crm-app/src/app/api/attendance/clock-in/route.ts
crm-app/src/app/api/attendance/clock-out/route.ts
crm-app/src/app/api/attendance/holidays/route.ts
crm-app/src/app/dashboard/attendance/
```

## מודל Interview
```typescript
id, candidateId, positionId
scheduledAt    // DateTime UTC!
type           // PHONE | VIDEO | IN_PERSON
status         // SCHEDULED | COMPLETED | CANCELLED | NO_SHOW
result         // PASSED | FAILED | PENDING
reminderSent   // Boolean
interviewerId
notes
```

## מודל Attendance
```typescript
id, userId, date   // YYYY-MM-DD
clockIn, clockOut  // DateTime UTC
hoursWorked        // מחושב
status             // PRESENT | ABSENT | LATE | HOLIDAY
```

## Diagnostic Procedure

### שלב 1: ראיון לא נשמר
```
POST /api/interviews { candidateId, scheduledAt, type }
← scheduledAt חייב ISO 8601: "2026-06-20T10:00:00Z"
← candidateId חייב קיים (FK)
← תאריכים UTC ב-DB, Israel Time ב-UI
```

### שלב 2: תזכורת לא נשלחה
```
POST /api/interview-reminders
← בדוק reminderSent != true
← בדוק SMS/Email credentials (Inforu/Brevo)
← cron רץ 24h לפני ראיון
```

### שלב 3: Clock-in/out
```
POST /api/attendance/clock-in  { userId, timestamp }
POST /api/attendance/clock-out { userId, attendanceId }
← לפני clock-out: בדוק שיש clockIn פתוח
← hoursWorked = (clockOut - clockIn) in hours
← Israel timezone = UTC+2/+3 (שים לב לשעון קיץ)
```

## בעיות נפוצות

### 1. Timezone שגוי בUI
```typescript
const israelTime = new Date(interview.scheduledAt).toLocaleString('he-IL', {
  timeZone: 'Asia/Jerusalem'
})
```

### 2. תזכורת כפולה
```typescript
if (interview.reminderSent) return
// עדכן מיד אחרי שליחה:
await prisma.interview.update({ data: { reminderSent: true } })
```

### 3. Clock-out ללא Clock-in
```typescript
const open = await prisma.attendance.findFirst({
  where: { userId, clockOut: null }
})
if (!open) return error("No active clock-in found")
```

## Interview Status Flow
```
SCHEDULED → COMPLETED / CANCELLED / NO_SHOW
COMPLETED → result: PASSED / FAILED / PENDING
```

## כללים חשובים
- ❌ לא לשנות scheduledAt אחרי COMPLETED
- ❌ לא לשלוח תזכורת אם reminderSent = true
- ❌ לא למחוק ראיון — שנה ל-CANCELLED
- ✅ תאריכים תמיד UTC בDB, המרה לישראל בUI
- ✅ לוג כל שינוי סטטוס ב-ActivityLog
