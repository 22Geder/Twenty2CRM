---
applyTo: "crm-app/src/app/api/**"
description: "הגנה על API endpoints - auth, validation, rate limiting, error handling"
---

# 🌐 הגנה על API Endpoints

יש במערכת **80+ endpoints**. כללים לכל אחד:

## 🔴 אסור בהחלט

### Authentication/Authorization
- ❌ endpoint ללא auth check (חוץ מ-public endpoints מוגדרים)
- ❌ לסמוך על `req.headers['user-id']` ללא verification
- ❌ admin-only endpoints ללא role check
- ❌ לחשוף endpoints כמו `/api/reset-dor`, `/api/restore`, `/api/init` ללא הגנה

### Input Handling
- ❌ `prisma.$queryRawUnsafe(userInput)` - SQL injection
- ❌ `eval()` / `Function()` על input מהמשתמש
- ❌ path traversal: `fs.readFile(userInput)` ללא validation
- ❌ `exec(userInput)` - command injection

### Output
- ❌ החזרת user passwords / tokens ב-response
- ❌ stack traces ל-production
- ❌ החזרת רשומות של users אחרים (IDOR)

## 🟢 תבנית מומלצת ל-endpoint

```typescript
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// 1. Schema validation
const requestSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
})

export async function POST(request: NextRequest) {
  try {
    // 2. Auth check (אם נדרש)
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 3. Parse & validate
    const body = await request.json()
    const parsed = requestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    // 4. Authorization check
    if (!canUserDoThis(session, parsed.data)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 5. Business logic
    const result = await prisma.candidate.create({ data: parsed.data })

    // 6. Response - רק שדות שצריך
    return NextResponse.json({
      success: true,
      id: result.id,
      // לא להחזיר את כל האובייקט!
    })

  } catch (error) {
    // 7. Error handling
    console.error('[endpoint-name] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

## 🛡️ Endpoints רגישים במיוחד

### דורשים הגנה מקסימלית
| Endpoint | סיכון | הגנה נדרשת |
|----------|-------|-------------|
| `/api/restore` | דורס DB | admin only + confirmation token |
| `/api/backup` | חושף data | admin only |
| `/api/reset-dor` | משנה סיסמה | ✂️ להסיר או admin-only |
| `/api/init` | אתחול | block in production |
| `/api/gmail-*` | credentials | auth + rate limit |
| `/api/send-bulk-*` | spam risk | admin + rate limit |
| `/api/cron/*` | triggers jobs | secret header only |

### Public endpoints (חייבים extra care)
- `/api/auth/*` - auth flow
- `/api/share-target` - PWA share
- `/api/unsubscribe` - email unsubscribe
- `/api/sms-webhook`, `/api/gmail-webhook` - external callbacks

## 🚦 Rate Limiting

### חובה לכל endpoint ציבורי
```typescript
// מומלץ: @upstash/ratelimit או in-memory
const limits = {
  '/api/auth/login': '5/min',
  '/api/send-bulk-*': '10/hour',
  '/api/gmail-poll': '6/hour', // every 10 min
  default: '60/min'
}
```

## 📋 Checklist לכל endpoint חדש

- [ ] Input validation עם Zod/similar
- [ ] Auth check (אם לא public)
- [ ] Authorization check (המשתמש יכול לבצע זאת?)
- [ ] Rate limiting
- [ ] try/catch עם error handling
- [ ] לא חושף credentials/PII ב-response
- [ ] לא חושף stack traces
- [ ] לוג שגיאות (בלי PII)
- [ ] HTTPS only (לא HTTP)
- [ ] CORS headers מוגדרים נכון

## 🔍 לפני עריכת endpoint קיים

1. **קרא את כל הקובץ** - איך הוא משתמש ב-prisma?
2. **מצא usages** - מאיפה הוא נקרא? (frontend, cron, webhook?)
3. **בדוק auth** - האם יש בדיקת הרשאות?
4. **שמור תאימות** - אל תשנה את schema של ה-response
5. **הרץ בדיקה** אחרי שינוי
