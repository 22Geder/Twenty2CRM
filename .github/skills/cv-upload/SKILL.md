---
name: cv-upload
description: "Diagnose and fix CV upload issues in TWENTY2CRM. Use when: file upload fails, PDF extraction broken, gibberish text, MIME type rejection, Gemini errors, candidates not saved, duplicate detection, DOCX/DOC parsing fails, Hebrew encoding problems, dropzone rejects files, OCR needed for scanned PDFs. Triggers: 'בעיה בהעלאת קורות חיים', 'upload fails', 'PDF לא עובד', 'ג'יבריש', 'קובץ לא מתקבל', 'שגיאה בהעלאה'."
argument-hint: "Describe the upload error or behavior you're seeing"
---

# CV Upload Skill — TWENTY2CRM

## When to Use
Load this skill when dealing with any problem in the CV upload pipeline:
- Files rejected before reaching server (dropzone, MIME)
- PDF text extraction returning empty or gibberish
- Gemini AI parsing failures or timeouts
- Candidates not being saved to DB (duplicates, constraint errors)
- Hebrew encoding / CID font gibberish on paste
- DOCX/DOC/image parsing failures
- Rate limiting (429) from Gemini

## System Architecture
See [architecture reference](./references/architecture.md) for the full file map and data flow.

## Diagnostic Procedure

### Step 1 — Identify where it fails
```
Client drag/drop → Server /api/upload → Text extraction → Gemini parse → DB save
```
Ask: Does the error happen before upload? During upload? After upload (save fails)?

### Step 2 — Check server logs
Look for emoji prefixes in Railway logs:
- `📄` = text extraction step
- `✅` = success
- `⚠️` = warning/fallback triggered
- `❌` = hard failure
- `⏳` = Gemini rate limit retry

### Step 3 — Match symptom to known fix
See [known-fixes reference](./references/known-fixes.md) for all diagnosed issues and their solutions.

### Step 4 — Validate files after fixing
Always run `get_errors` on every modified file. Check for:
- TypeScript errors
- Broken imports
- Wrong pdf-parse API usage (see Known Fix #1)

## Key Rules

1. **pdf-parse API** — NEVER use `new PDFParse()` class pattern. Always:
   ```typescript
   let pdfParse: any;
   try { pdfParse = require('pdf-parse/lib/pdf-parse'); }
   catch { pdfParse = require('pdf-parse'); }
   const data = await pdfParse(buffer);
   // data.text is the extracted text
   ```

2. **Dropzone accept** — NEVER use MIME-based `accept: { 'application/pdf': ... }`. WhatsApp/Gmail files have MIME `application/octet-stream`. Always use extension-based `validator`.

3. **Gibberish detection** — Hebrew PDFs with embedded CID fonts produce PUA Unicode (U+E000–U+F8FF) on copy-paste. Detect with readable-char ratio < 0.4 and reject with a Hebrew user message.

4. **Gemini timeout** — Wrap all Gemini calls with `Promise.race([call, timeout(45000)])` and `withGeminiRetry()` (2 retries, 3s/6s delays).

5. **DB race condition** — `prisma.candidate.create()` can throw P2002 (unique constraint) on concurrent uploads. Always catch and fall back to `findFirst` + link.

6. **File size limit** — Server: 25MB. Client dropzone validator: 25MB. Mobile upload page: 25MB. These MUST be in sync.

## Files Quick Map

| File | Purpose |
|------|---------|
| `src/app/api/upload/route.ts` | Main upload API — text extraction + Gemini parse + DB save |
| `src/app/api/analyze-cv/route.ts` | Text analysis for paste flow |
| `src/app/api/analyze-cv-dual/route.ts` | Dual analysis for recruitment board |
| `src/app/dashboard/upload/page.tsx` | Bulk upload UI (dropzone, up to 500 files) |
| `src/app/upload-cv/page.tsx` | Mobile single-file upload page |
| `src/app/dashboard/recruitment-board/page.tsx` | Paste-CV textarea + candidate board |

## After Every Fix

- [ ] `get_errors` on all modified files
- [ ] Check TypeScript types are correct
- [ ] Verify pdf-parse API pattern (not class-based)
- [ ] Verify file size constants are in sync (25MB everywhere)
- [ ] Check Hebrew error messages are returned to user
- [ ] Record the fix in [known-fixes reference](./references/known-fixes.md)
