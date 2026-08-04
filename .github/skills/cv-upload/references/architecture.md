# CV Upload System — Architecture & Data Flow

## Full Upload Pipeline

```
User Action
    │
    ├─── Paste text ─────────────────────────────────────────────────┐
    │    (recruitment-board/page.tsx)                                 │
    │       ↓                                                         │
    │    Client gibberish check (readableRatio < 0.4 → reject)       │
    │       ↓                                                         │
    │    POST /api/analyze-cv  (or /api/analyze-cv-dual)             │
    │       ↓                                                         │
    │    Server gibberish check → Gemini → return parsed JSON        │
    │       ↓                                                         │
    │    Save to DB via /api/candidates POST                         │
    │                                                                 │
    └─── Drop/Upload file ──────────────────────────────────────────┐ │
         (dashboard/upload/page.tsx OR upload-cv/page.tsx)          │ │
            ↓                                                        │ │
         Client extension validator (NOT MIME-based!)               │ │
            ↓                                                        │ │
         POST /api/upload (multipart/form-data)                     │ │
            ↓                                                        │ │
         Text Extraction (see extraction flow below)                │ │
            ↓                                                        │ │
         Gemini parse → candidate JSON                              │ │
            ↓                                                        │ │
         Duplicate detection (email + phone check)                  │ │
            ↓                                                        │ │
         prisma.candidate.create() → P2002 catch → findFirst        │ │
```

## Text Extraction Flow (in /api/upload/route.ts)

```
PDF file
 ├── pdf-parse (15s timeout) → text >= 100 chars? → done
 └── fallback: Gemini Vision OCR (30s timeout)

DOCX file
 ├── mammoth.extractRawText → text >= 10 chars? → done
 └── fallback: Gemini Vision OCR

DOC file (old binary format)
 ├── mammoth (may fail) 
 ├── fallback: binary string extraction (Latin1 decode)
 └── fallback: Gemini Vision OCR

Image (jpg/jpeg/png/gif/webp/heic/heif/bmp/tiff)
 └── Gemini Vision OCR (always, primary method)

TXT / RTF
 └── Buffer.toString('utf-8') → UTF-16LE fallback
```

## Gemini AI Parse Flow

After text extraction:
```
extractedText
    ↓
withGeminiRetry(fn, maxRetries=2)   — handles 429/quota/RESOURCE_EXHAUSTED
    ↓ (3s, 6s delays between retries)
model.generateContent(prompt)        — timeout: 45s
    ↓
JSON parse response
    ↓
Validate + normalize fields via:
  - isLikelyEmail()
  - parseYearsOfExperience()
  - normalizeMaybeValue()
    ↓
candidateData object
```

## Key Constants

| Constant | Value | Location |
|---------|-------|---------|
| MAX_FILE_SIZE | 25 MB | upload/route.ts, upload/page.tsx, upload-cv/page.tsx |
| AI_TIMEOUT | 45,000 ms | upload/route.ts |
| PDF_PARSE_TIMEOUT | 15,000 ms | upload/route.ts |
| Gemini OCR TIMEOUT | 30,000 ms | upload/route.ts |
| MAX_RETRIES (Gemini) | 2 | upload/route.ts |
| Retry delays | 3s, 6s | upload/route.ts |
| Text min length | 10 chars | upload/route.ts |
| Quality threshold | < 10 fields && text < 50 chars | upload/route.ts |
| Gibberish ratio | < 0.4 readable | analyze-cv/route.ts, analyze-cv-dual/route.ts, recruitment-board/page.tsx |

## Database (Prisma)

- **DB**: PostgreSQL on Railway
- **Model**: `Candidate` in `crm-app/prisma/schema.prisma`
- **Unique constraint**: email (if provided)
- **Race condition**: concurrent uploads → P2002 → fallback to `findFirst` + link to job

## Allowed File Extensions (dropzone validator)

```
.pdf .docx .doc .rtf .txt .odt
.jpg .jpeg .png .gif .webp .heic .heif .bmp .tiff .tif
```

**Do NOT** use MIME types for filtering — WhatsApp/Gmail attachments arrive as `application/octet-stream`.

## Environment Variables Required

| Variable | Purpose |
|---------|---------|
| `GEMINI_API_KEY` | Google Gemini (default model: gemini-2.5-flash) |
| `GEMINI_MODEL` | (optional) Override the Gemini model name without code changes. Default: `gemini-2.5-flash`. Set this if Google deprecates the current model (see Fix #9). |
| `DATABASE_URL` | PostgreSQL on Railway |
| `NEXTAUTH_SECRET` | Session auth |
