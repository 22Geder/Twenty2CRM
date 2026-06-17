# Known Issues & Fixes — CV Upload System

All diagnosed bugs, their root causes, and verified fixes. Update this file after every new fix.

---

## Fix #1 — Broken pdf-parse API (April 2026)

**Symptom**: PDF uploads always fail with "לא הצלחנו לקרוא את קובץ ה-PDF", even for simple text PDFs.

**Root cause**: Code used `const { PDFParse } = require('pdf-parse')` and `new PDFParse({...})` — this class does not exist in the `pdf-parse` npm package.

**Wrong code**:
```typescript
const { PDFParse } = require('pdf-parse');
const parser = new PDFParse({ data: new Uint8Array(buffer) });
const result = await parser.getText();
pdfParseText = result.text || '';
await parser.destroy().catch(() => {});
```

**Correct code**:
```typescript
let pdfParse: any;
try { pdfParse = require('pdf-parse/lib/pdf-parse'); }
catch { pdfParse = require('pdf-parse'); }
const data = await Promise.race([
  pdfParse(buffer),
  new Promise<never>((_, reject) => setTimeout(() => reject(new Error('pdf-parse timeout')), 15000))
]);
pdfParseText = data.text || '';
```

**File**: `crm-app/src/app/api/upload/route.ts` — function `extractTextFromPDF()`

**Status**: ✅ Fixed April 28, 2026

---

## Fix #2 — Hebrew PDF CID/PUA Gibberish on Paste (April 2026)

**Symptom**: User pastes text from PDF, system processes it but creates garbage candidates. Gemini either hallucinates or returns nonsense.

**Root cause**: Hebrew PDFs with CID (Character IDentifier) or PUA (Private Use Area) embedded fonts produce Unicode U+E000–U+F8FF characters (Private Use Area) when copied to clipboard. These are not real Hebrew characters.

**Detection logic** (readableRatio check):
```typescript
function detectGibberish(text: string): { isGibberish: boolean; readableRatio: number } {
  let readable = 0;
  for (const ch of text) {
    const cp = ch.codePointAt(0) ?? 0;
    const isHebrew = cp >= 0x0590 && cp <= 0x05FF;
    const isLatin = (cp >= 65 && cp <= 90) || (cp >= 97 && cp <= 122);
    const isDigit = cp >= 48 && cp <= 57;
    const isPunct = ' .,;:!?-–—()[]{}/@#\n\r\t'.includes(ch);
    if (isHebrew || isLatin || isDigit || isPunct) readable++;
  }
  const readableRatio = text.length > 0 ? readable / text.length : 1;
  return { isGibberish: readableRatio < 0.4, readableRatio };
}
```

**Where to add**: 
1. Server-side: `api/analyze-cv/route.ts` — before Gemini call
2. Server-side: `api/analyze-cv-dual/route.ts` — before Gemini call
3. Client-side: `dashboard/recruitment-board/page.tsx` — in `analyze()` before API call

**User message to show**: `"⚠️ הטקסט מכיל ג'יבריש - סביר להניח שהעתקת מ-PDF עם פונט מוטבע. העלה את הקובץ ישירות במקום להעתיק."`

**Status**: ✅ Fixed April 2026

---

## Fix #3 — Dropzone Rejects WhatsApp/Gmail Files (April 2026)

**Symptom**: Files downloaded from WhatsApp, Gmail, or email clients cannot be uploaded. They appear to silently fail or show "unsupported format" error even for valid PDFs.

**Root cause**: `react-dropzone` with MIME-based `accept` configuration. WhatsApp and Gmail often serve files with MIME type `application/octet-stream` regardless of actual file extension.

**Wrong config**:
```typescript
accept: {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  // etc.
}
```

**Correct config** (extension-based validator):
```typescript
accept: undefined,
validator: (file) => {
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  const allowed = ['.pdf', '.docx', '.doc', '.rtf', '.txt', '.odt',
                   '.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif', '.bmp', '.tiff', '.tif'];
  if (!allowed.includes(ext)) {
    return { code: 'unsupported-format', message: `סוג קובץ לא נתמך: ${ext}. השתמש ב-PDF, DOCX, DOC, RTF, TXT או תמונה.` };
  }
  if (file.size > 25 * 1024 * 1024) {
    return { code: 'file-too-large', message: `הקובץ גדול מדי (${(file.size/1024/1024).toFixed(1)}MB). מקסימום 25MB.` };
  }
  return null;
}
```

**File**: `crm-app/src/app/dashboard/upload/page.tsx` — `useDropzone()` config

**Status**: ✅ Fixed April 2026

---

## Fix #4 — File Size Mismatch Between Pages (April 2026)

**Symptom**: Mobile upload page allows users to select large files, then server rejects them with confusing error.

**Root cause**: `upload-cv/page.tsx` had hardcoded `20 * 1024 * 1024` (20MB) while server accepts 25MB.

**Fix**: Change `20 * 1024 * 1024` to `25 * 1024 * 1024` in `upload-cv/page.tsx`.

**Rule**: ALL three locations must match: `upload/route.ts`, `dashboard/upload/page.tsx`, `upload-cv/page.tsx`.

**Status**: ✅ Fixed April 2026

---

## Fix #5 — Gemini 429 Rate Limit Crashes Upload (Previous Session)

**Symptom**: Upload fails randomly with "quota exceeded" or "RESOURCE_EXHAUSTED" errors.

**Root cause**: No retry logic — single Gemini call fails permanently on rate limit.

**Fix**: `withGeminiRetry()` wrapper with 2 retries (3s, 6s delays):
```typescript
async function withGeminiRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const isRateLimit = error?.message?.includes('429') || 
                          error?.message?.includes('quota') || 
                          error?.message?.includes('RESOURCE_EXHAUSTED');
      if (isRateLimit && attempt < maxRetries) {
        const waitMs = (attempt + 1) * 3000;
        await new Promise(resolve => setTimeout(resolve, waitMs));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Gemini retry exhausted');
}
```

**Status**: ✅ Fixed (previous session)

---

## Fix #6 — DB Race Condition on Concurrent Uploads (Previous Session)

**Symptom**: When uploading many files at once, some fail with Prisma P2002 "unique constraint" error.

**Root cause**: Two concurrent uploads find the same email doesn't exist, both try to `create()` → one fails.

**Fix**: Catch P2002 and recover:
```typescript
try {
  candidate = await prisma.candidate.create({ data: candidateData });
} catch (e: any) {
  if (e?.code === 'P2002') {
    // Race condition - find existing
    candidate = await prisma.candidate.findFirst({
      where: { OR: [{ email: normalizedEmail }, { phone: phone }] }
    });
  } else throw e;
}
```

**Status**: ✅ Fixed (previous session)

---

## Fix #7 — Gemini and PDF Timeouts (Previous Session)

**Symptom**: Upload hangs forever, no response, eventually times out at the HTTP level.

**Fix**: Add explicit timeouts:
- AI parse: `Promise.race([geminiCall, timeout(45000)])`
- PDF parse: `Promise.race([pdfParse(buffer), timeout(15000)])`
- Gemini OCR: `Promise.race([geminiOCR, timeout(30000)])`

**Status**: ✅ Fixed (previous session)

---

---

## Fix #8 — Double Gemini Call Per File (June 2026)

**Symptom**: 60-70% of CVs upload successfully when uploading many files. The rest fail silently or with rate limit errors.

**Root cause**: For each "good quality" file, the client made TWO full API calls:
1. `confirmOnly=true` → text extraction + Gemini AI parse (not saved)
2. Save call → text extraction AGAIN + Gemini AI parse AGAIN

This doubled the Gemini API calls and hit rate limits (429/RESOURCE_EXHAUSTED).

**Fix**: 
- **`route.ts`**: Read `preExtractedData` from formData. If present and valid, skip `extractCVWithAI()` and use the pre-parsed data directly. Log `♻️ Using pre-extracted candidate data (skipping Gemini)`.
- **`page.tsx` (processFiles)**: In save call, append `preExtractedData: JSON.stringify(checkData.candidate)`.
- **`page.tsx` (confirmAndAdd)**: Use `editedData[fileName] || files[fileIndex]?.candidate` as `preExtractedData`.
- **`page.tsx` (updateExistingCandidate)**: Pass `files[fileIndex]?.candidate` as `preExtractedData`.

**Result**: Each file now makes only 1 Gemini call (during confirmOnly). The save step reuses the cached result.

**Status**: ✅ Fixed June 2026

---

## Fix #9 — Deprecated Gemini Model `gemini-2.0-flash` (June 2026)

**Symptom**: Almost ALL CV uploads fail to read the candidate's name. Every AI feature (CV extraction, matching, candidate search, analysis) silently degrades. Names come out wrong/empty because the system falls back to regex extraction which can't parse Hebrew names well.

**Root cause**: Google **removed** the `gemini-2.0-flash` model. Direct API call returns:
```
[404] This model models/gemini-2.0-flash is no longer available.
Please update your code to use a newer model for the latest features and improvements.
```
Every `genAI.getGenerativeModel({ model: "gemini-2.0-flash" })` call throws 404 → caught by the try/catch → `return null` → regex fallback (`analyzeCVText`) runs → poor Hebrew name extraction.

**Critical detail**: The model name was **hardcoded in 28 places across 14 files** (upload/route.ts ×4, gemini-ai.ts ×6, advanced-matching.ts ×4, analyze-cv, analyze-cv-dual, ai-match-*, ai-analyze, ai-candidate-search, candidates/[id]/ai-analysis, send-candidate-to-employer, and dead `-Twenty.ts` alternates).

**Diagnosis script** (list working models for the current key):
```javascript
const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${KEY}`);
const data = await res.json();
data.models.filter(m => m.supportedGenerationMethods?.includes('generateContent'))
           .forEach(m => console.log(m.name));
```

**Fix**: Replace every occurrence with an env-overridable, current model:
```typescript
// ❌ Before
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
// ✅ After
const model = genAI.getGenerativeModel({ model: (process.env.GEMINI_MODEL || "gemini-2.5-flash") });
```
`gemini-2.5-flash` is multimodal (supports vision OCR for images/PDF) and verified working. The `process.env.GEMINI_MODEL` override means future deprecations need only a Railway env var change — no code edit/redeploy.

**Verification**: Real Hebrew CV extraction test returned the correct name in ~3s. `tsc --noEmit` shows no new errors in the 14 edited files.

**Rule going forward**: NEVER hardcode `gemini-2.0-flash` / `gemini-1.5-flash` (both removed). Always use `process.env.GEMINI_MODEL || "gemini-2.5-flash"`. When a broad "AI stopped working" symptom appears, FIRST test the model name against the live API before debugging anything else.

**Status**: ✅ Fixed June 2026

---

## Patterns to Watch For

When a new upload bug is reported, check these in order:
1. **Did the AI suddenly stop reading names across the board?** → Deprecated model → Fix #9 (test the model name first!)
2. **Is pdf-parse being called correctly?** (not class-based) → Fix #1
3. **Is the error client-side (before network)?** → Dropzone MIME issue → Fix #3
4. **Is the text garbled/empty?** → Check extraction fallback chain (architecture.md)
5. **Is it Gemini timing out?** → Check retry+timeout wrappers → Fix #5/#7
6. **Is it only failing on bulk uploads?** → DB race condition → Fix #6
7. **Is paste-text garbled?** → CID font PUA issue → Fix #2
