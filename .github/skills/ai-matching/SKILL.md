# SKILL: AI Matching — TWENTY2CRM

## מתי להשתמש בסקיל הזה
- Gemini מחזיר שגיאה / timeout בזמן matching
- ניקוד מועמד-משרה שגוי או לא הגיוני
- `advanced-matching.ts` זורק exception
- AI matching איטי מ-30 שניות
- `/api/best-matches` / `/api/smart-matching` מחזירים 500
- Dual matching לא עובד
- Matching לא מוצא מועמדים שצריך למצוא

## קבצים רלוונטיים
```
crm-app/src/lib/advanced-matching.ts     ← לוגיקת matching ראשית
crm-app/src/lib/gemini-ai.ts             ← חיבור ל-Gemini API
crm-app/src/app/api/ai-match-v3/route.ts
crm-app/src/app/api/smart-matching/route.ts
crm-app/src/app/api/best-matches/route.ts
crm-app/src/app/api/dual-matching/route.ts
crm-app/src/app/api/ai-match-simple/route.ts
crm-app/src/app/api/ai-analyze/route.ts
crm-app/src/components/advanced-matching-view.tsx
crm-app/src/components/smart-ai-matching.tsx
crm-app/src/components/dual-matching-view.tsx
```

## משתני סביבה נדרשים
```
GEMINI_API_KEY   ← חובה לכל קריאת AI
```

## צ'קליסט דיאגנוסטי (לפי סדר)

### שלב 1: בדוק את ה-API Key
```powershell
# בדוק שה-key קיים
cd crm-app ; node -e "console.log('KEY:', process.env.GEMINI_API_KEY ? 'EXISTS' : 'MISSING')"
```

### שלב 2: בדוק חיבור ל-Gemini
```typescript
// ב-gemini-ai.ts - בדוק שה-model name נכון:
// gemini-1.5-flash  ← מהיר ויותר זול
// gemini-1.5-pro    ← איטי ויקר
// gemini-2.0-flash  ← חדש (2025)
```

### שלב 3: בדוק timeout settings
- בדוק ש-timeout >= 30000ms בכל קריאת API
- אם matching > 50 מועמדים → batch לקבוצות של 20

### שלב 4: בדוק לוגיקת ניקוד
- ניקוד 0 תמיד → `aiProfile` של המועמד ריק (לא נותח)
- ניקוד זהה לכולם → Gemini מחזיר cached response
- ניקוד גבוה ל"לא מתאים" → בדוק prompt ב-`advanced-matching.ts`

## בעיות שכיחות ופתרונות

### 1. שגיאת 429 - Rate Limit
```typescript
// הוסף delay בין בקשות:
await new Promise(r => setTimeout(r, 1000));
```

### 2. שגיאת "Candidate has no aiProfile"
- המועמד הועלה לפני שה-AI ניתח אותו
- פתרון: קרא ל-`/api/analyze-cv` עם ה-candidateId תחילה

### 3. matching מחזיר 0 תוצאות
- בדוק שהמשרה יש לה `active: true`
- בדוק שהמשרה יש `keywords`
- בדוק שהמועמד יש `resume` / `skills`

### 4. TypeScript error ב-advanced-matching.ts
- אל תשנה את ה-return type של `matchCandidateToPosition`
- ה-function מחזיר `MatchResult` - שמור על הממשק

## כללים חשובים
- ❌ לא לשנות את לוגיקת הניקוד (`scoreFactors`) בלי בדיקה
- ❌ לא לשנות את ה-Gemini model name בלי לבדוק שהוא קיים
- ✅ תמיד fallback לניקוד keyword בסיסי אם Gemini נכשל
- ✅ cache תוצאות matching כשאפשר (Redis / memory)
