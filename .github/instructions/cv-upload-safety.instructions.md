---
applyTo: "crm-app/src/app/api/upload/**,crm-app/src/app/api/analyze-cv/**,crm-app/src/app/api/analyze-cv-dual/**,crm-app/src/app/dashboard/upload/**,crm-app/src/app/upload-cv/**"
description: "הנחיות עבודה על מערכת העלאת קורות חיים של TWENTY2CRM — pdf-parse, dropzone, Gemini, gibberish detection"
---

# CV Upload Safety Rules

## 🔴 אסור לשנות ללא בדיקה מלאה

1. **pdf-parse API** — אסור להשתמש ב-`new PDFParse()` או `PDFParse` class. זה לא קיים בחבילה!
   - תמיד: `const data = await pdfParse(buffer); text = data.text`
   - ה-require חייב להיות: `require('pdf-parse/lib/pdf-parse')` עם fallback ל-`require('pdf-parse')`

2. **Dropzone accept** — אסור לחזור ל-MIME-based accept. קבצים מ-WhatsApp/Gmail מגיעים עם `application/octet-stream`.
   - תמיד: extension-based `validator` על `file.name`

3. **File size constants** — שלושה מקומות חייבים להיות מסונכרנים: server (25MB), dashboard/upload, upload-cv.

4. **Gemini calls** — חייבים `withGeminiRetry()` + `Promise.race([call, timeout(45000)])`.

5. **DB create** — חייב catch על P2002 עם fallback ל-`findFirst`.

## 🟡 לפני כל שינוי

- קרא את `SKILL.md` של `cv-upload` ואת `references/known-fixes.md`
- הרץ `get_errors` על כל קובץ שנגעת בו
- בדוק שכל הגבולות (timeouts, file sizes, thresholds) עדיין נכונים

## 🟢 אחרי כל תיקון

- עדכן את `references/known-fixes.md` עם הבעיה החדשה והתיקון שלה
- סכם בעברית מה השתנה ומדוע
