# Diagnostic Guide — CV Upload Problems

## Quick Symptom Lookup

| Symptom | Most Likely Cause | Fix |
|--------|------------------|-----|
| File never starts uploading | Dropzone MIME rejection | Fix #3 — use extension validator |
| "קובץ לא נתמך" for valid PDF | Dropzone MIME rejection | Fix #3 |
| PDF extracts empty text | pdf-parse API wrong | Fix #1 |
| PDF extracts empty text (scanned) | Need Gemini OCR | Check OCR fallback |
| DOCX returns "too little text" | Damaged/complex DOCX | Check mammoth + Gemini fallback |
| Gemini returns garbage JSON | Bad prompt or too little text | Check text length before calling |
| Upload hangs > 60 seconds | Missing timeout | Fix #7 |
| 429 / quota error | Rate limit, no retry | Fix #5 |
| Random P2002 on bulk upload | DB race condition | Fix #6 |
| Paste shows garbled candidate | CID/PUA font gibberish | Fix #2 |
| Candidate saved with wrong name | Gemini hallucinated | Check quality threshold |
| Same candidate saved twice | Duplicate detection broken | Check email/phone dedup logic |

---

## Diagnostic Questions to Ask the User

1. **What file type?** (PDF, DOCX, DOC, image, TXT)
2. **Where does it fail?** (file doesn't appear in UI / upload starts but fails / upload "succeeds" but candidate wrong)
3. **Is the PDF text-based or scanned?** (Can you select text in it with your mouse?)
4. **Did it come from WhatsApp or email?**
5. **Does it fail for all files or specific ones?**
6. **Is it a single upload or bulk (multiple files)?**
7. **What does the error message say exactly?**

---

## Reading Railway Server Logs

Connect: Railway dashboard → your project → Deployments → View logs

Search for the filename or these patterns:
```
📄 Processing PDF: <filename>
📄 pdf-parse extracted: X chars
📄 Gemini PDF OCR extracted: X chars
❌ PDF text extraction failed
⚠️ pdf-parse failed: <error>
⏳ Gemini rate limited, retrying
✅ Gemini Vision extracted: X chars
```

If you see `pdf-parse extracted: 0 chars` AND `Gemini PDF OCR extracted: 0 chars` → the PDF is either:
- Password protected
- Corrupted
- An image-only PDF with no text layer and Gemini couldn't read it

---

## Verifying the pdf-parse Call Is Correct

Correct pattern:
```typescript
let pdfParse: any;
try { pdfParse = require('pdf-parse/lib/pdf-parse'); }
catch { pdfParse = require('pdf-parse'); }
const data = await pdfParse(buffer);
const text = data.text || '';
```

Wrong patterns that will fail:
```typescript
// ❌ Class doesn't exist
const { PDFParse } = require('pdf-parse');
const parser = new PDFParse({ data: new Uint8Array(buffer) });

// ❌ Default import may not work with Next.js
import pdfParse from 'pdf-parse';

// ❌ Missing await
const data = pdfParse(buffer);
```

---

## Verifying Dropzone Is Extension-Based

In `dashboard/upload/page.tsx`, find `useDropzone(`. Confirm it has:
- `accept: undefined` (or no `accept` prop at all)  
- `validator: (file) => { ... }` that checks `file.name.split('.').pop()`

If `accept:` has MIME type keys like `'application/pdf'` → Fix #3 must be applied.

---

## Verifying File Size Consistency

Check these three values are all `25 * 1024 * 1024` (26,214,400 bytes):
1. `crm-app/src/app/api/upload/route.ts` — `const MAX_FILE_SIZE = ...`
2. `crm-app/src/app/dashboard/upload/page.tsx` — in the validator callback
3. `crm-app/src/app/upload-cv/page.tsx` — where file size is checked before upload

---

## Testing After a Fix

### Test PDF upload
1. Use a standard text-based PDF (e.g., a Word-saved PDF)
2. Try a scanned image PDF (Gemini OCR path)
3. Try a PDF downloaded from WhatsApp

### Test paste
1. Copy text from a PDF that has actual text (not scanned)
2. Copy text from a problematic PDF with embedded fonts → should show gibberish warning

### Test bulk upload
1. Upload 5+ files simultaneously from `dashboard/upload`
2. Verify all succeed (DB race condition)

### Check Railway logs during test
Watch for error patterns and verify the correct extraction path was taken.
