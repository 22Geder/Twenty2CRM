---
applyTo: "**/.env*,**/service-account-key.json,**/RAILWAY_VARIABLES.txt,**/*.key,**/*.pem,**/auth/**,**/api/auth/**"
description: "הגנה על סודות, credentials, tokens, API keys"
---

# 🔐 הגנה על סודות ו-Credentials

## 🔴 אסור בהחלט

### הדפסה/חשיפה
- ❌ `console.log(process.env)` - מדפיס הכל
- ❌ `console.log(serviceAccountKey)` / `console.log(token)`
- ❌ החזרת credentials ב-API response
- ❌ כתיבת credentials לקבצי log
- ❌ שליחת credentials ב-error messages ללקוח

### Commits
- ❌ commit של `.env`, `.env.local`, `.env.production`
- ❌ commit של `service-account-key.json`
- ❌ commit של `RAILWAY_VARIABLES.txt`
- ❌ commit של backup files (`*.sql`, `*.dump`)
- ❌ hardcoded credentials בקוד

### Transmission
- ❌ credentials ב-URL query params (`?apikey=xxx`)
- ❌ credentials ב-GET requests
- ❌ HTTP (not HTTPS) לנקודות קצה עם auth

## 🟢 עבודה נכונה

### קריאת env variables
```typescript
// ✅ טוב
import { env } from '@/lib/env'
const apiKey = env.GEMINI_API_KEY

// ❌ רע
const apiKey = process.env.GEMINI_API_KEY! // ללא validation
```

### Service Account (Gmail)
```typescript
// ✅ טוב
const keyPath = path.join(process.cwd(), 'service-account-key.json')
if (!fs.existsSync(keyPath)) {
  return NextResponse.json({ error: 'Configuration error' }, { status: 500 })
  // לא לחשוף שחסר איזה קובץ!
}

// ❌ רע
console.log('Using key from:', keyPath)
console.log('Key content:', fs.readFileSync(keyPath))
```

### Error Messages
```typescript
// ✅ טוב - הודעה גנרית ללקוח, פרטים ב-server log
try { /* ... */ }
catch (error) {
  console.error('[gmail-poll] Error:', error) // server only
  return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
}

// ❌ רע
catch (error) {
  return NextResponse.json({ error: error.message, stack: error.stack })
  // עלול לחשוף paths, credentials, DB structure
}
```

### Passwords
- תמיד `bcrypt` / `argon2` - לא MD5/SHA1
- minimum 12 characters
- לא לשלוח password במייל / SMS בטקסט גלוי
- Reset tokens: חד-פעמיים, תפוגה 1 שעה

### API Keys ב-Frontend
- ❌ `NEXT_PUBLIC_*` אסור ל-secrets (חשוף בצד לקוח!)
- ✅ secrets רק דרך API routes (`/api/*`)

## 🛡️ Defense Layers

### 1. `.gitignore` - וודא שכולל:
```
.env*
service-account-key.json
RAILWAY_VARIABLES.txt
*.key
*.pem
exported-data.json
restore-backup/
```

### 2. Pre-commit check
לפני commit - חפש בקבצים שעומדים להיכנס:
- `sk-`, `AIza`, `ghp_`, `xoxb-` (API key prefixes)
- `-----BEGIN PRIVATE KEY-----`
- `password=`, `secret=`, `token=` עם ערכים ממשיים

### 3. אם credentials דלפו
1. **מיידית** - rotate את הסוד (צור חדש, השבת ישן)
2. עדכן בכל המערכות (Railway, Vercel, local)
3. בדוק logs לשימוש חשוד
4. הודע למשתמש

## 📋 רשימת Credentials במערכת

מה שקיים במערכת (אף פעם לא לחשוף):
- `service-account-key.json` - Google Service Account
- `DATABASE_URL` - Prisma DB connection
- `GEMINI_API_KEY` - Google Gemini AI
- `GMAIL_*` - Gmail API credentials
- `SMTP_*` - Email sending
- `WHATSAPP_*` - WhatsApp Business
- `TWILIO_*` - SMS
- `JWT_SECRET` / `NEXTAUTH_SECRET` - authentication
- `RAILWAY_TOKEN` - deployment

## 🚨 אם זיהית דליפה

עצור מיד, אל תבצע commit, והודע למשתמש:
> "⚠️ זיהיתי credential חשוף בקוד. אני עוצר ומבקש ממך לטפל בזה לפני המשך."
