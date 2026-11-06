# TWENTY2CRM — PROJECT MEMORY
עודכן לאחרונה: 2026-10-18

## פרויקט
- **Stack:** Next.js 15 (App Router) + Prisma + Railway PostgreSQL + NextAuth
- **UI:** Tailwind CSS + shadcn/ui + lucide-react
- **כיוון:** RTL (עברית)
- **Git:** 22Geder/Twenty2CRM, branch: main

## ארכיטקטורה
- `crm-app/` — Next.js app
- `crm-app/src/app/` — App Router pages + API routes
- `crm-app/src/components/` — shared components
- `crm-app/prisma/` — Prisma schema + migrations

## שגיאות TypeScript ידועות (pre-existing, לא לתקן)
- `src/app/api/reminders/[id]/route.ts` — params type mismatch (Next.js 15 async params)
- `next.config.ts` — `instrumentationHook` deprecated
- מספר API routes — Prisma schema מחוסרת שדות (`active`, `contactEmail`, `company`, וכו')
- `src/app/api/push-subscribe/route.ts` — `pushSubscription` not in schema

## יומן LOOP

### 2025-07 — Major UI Redesign (commit: 4d808bb)
**משימה:** הוספת Vertical Left Sidebar + slim header

**קבצים שנוצרו:**
- `crm-app/src/components/sidebar.tsx` — NEW Sidebar component
  - Dark navy (`#0a0820`) collapsible sidebar
  - 3 קבוצות: ראשי / כלים / מערכת
  - קיפול/פתיחה עם ChevronLeft/Right
  - Active state: cyan indicator bar + bg highlight
  - Badge support: AI (orange) / NEW (green)
  - User avatar + online status בתחתית
  - נסתר ב-mobile (`hidden lg:flex`)
  - TypeScript fix: הגדרת `NavItem` type עם optional `exact` ו-`badge`

**קבצים ששונו:**
- `crm-app/src/app/dashboard/layout.tsx`
  - הוסף `<Sidebar />` (fixed, left)
  - Main content: `lg:ml-[240px]` offset
  - שינוי רקע: `bg-slate-50`

- `crm-app/src/components/top-navbar.tsx`
  - פושט ל-slim header (`h-14`, bg-white)
  - breadcrumb: `TWENTY2CRM / [page name]`
  - הסרת: desktop nav items, search bar, logo (עברו ל-sidebar)
  - שמירה על: mobile hamburger + mobile menu, user avatar, bell icon
  - הסרת imports לא בשימוש: `Search`, `User`

**הערות:**
- כל ה-API routes, Prisma schema, ו-business logic — לא נגעו
- Build עבר ✅ (exit code 0)
- TypeScript errors הנותרות הן pre-existing ב-API routes

---

### 2025-07 — UI Component Styling Upgrade (commit: 7fc31d8)
**משימה:** שיפור עיצוב קומפוננטים — CSS/className בלבד

**קבצים ששונו:**

- `crm-app/src/components/positions-client.tsx`
  - SearchCard: הוסף `t22-card-soft`
  - ActivePositionCard: הוסף `t22-card-elevated`
  - DraftPositionCard: הוסף `t22-card-soft`
  - כפתורי "צפה בפרטים" / "ערוך": הוסף `rounded-xl`
  - No-results card: הוסף `t22-card-soft`

- `crm-app/src/app/dashboard/positions/bulk-upload/page.tsx`
  - **שינוי מרכזי:** כל הדף שונה מ-dark theme (slate-900/800) ל-light theme (white/slate-50)
  - כותרת: עטוף ב-`t22-card-soft p-6` עם `t22-h1` + `t22-sub`
  - Cards: `bg-slate-900/60 border-slate-700/50` → `t22-card-soft`
  - Inputs/textareas/selects: `bg-slate-800 text-white border-slate-600` → `bg-white text-slate-800 border-2 border-slate-200 rounded-xl`
  - Labels: `text-slate-400` → `font-semibold text-slate-700`
  - טקסטים: `text-white/text-slate-400` → `text-slate-900/text-slate-600`
  - Tags: `bg-orange-950/40 text-orange-300 border-orange-800/30` → `bg-orange-50 text-orange-700 border-orange-200`
  - Bottom save bar: `bg-slate-950/90 border-slate-700/50` → `t22-card-soft sticky bottom-4`
  - AddTagButton: `bg-slate-800 text-white` → `bg-white text-slate-800`

- `crm-app/src/app/dashboard/positions/new/page.tsx`
  - Header wrapper: הוסף `t22-card-soft p-6 mb-6`; `h1` → `t22-h1`; `p` → `t22-sub`
  - Cards: `mb-6` → `t22-card-soft mb-6` על כל כרטיסי הטופס
  - Labels: הוסף `font-semibold text-slate-700`
  - Inputs: הוסף `rounded-xl border-2`
  - Selects: `rounded-md border border-input` → `rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20`
  - כפתור שמירה: הוסף `t22-btn-primary rounded-xl px-6 py-2.5`

- `crm-app/src/app/dashboard/candidates/page.tsx`
  - Search Card: הוסף `t22-card-soft`
  - Email span: `truncate` → `overflow-hidden text-ellipsis whitespace-nowrap`
  - Manual summary: inline style → classes `bg-[#FEFCE8] border-amber-100 rounded-lg`

- `crm-app/src/app/dashboard/employers/page.tsx`
  - Employer cards: הוסף `t22-card-elevated` (בנוסף ל-`t22-card-soft` קיים)
  - Description: הוסף `max-h-20 overflow-hidden`
  - "לפרטים" button: `t22-btn-outline px-3 py-1.5` → `border-2 border-blue-500 text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-xl`

- `crm-app/src/app/dashboard/settings/page.tsx`
  - Outer div: `max-w-[1200px] mx-auto` → `t22-page-wrap`
  - Sticky bottom save bar: כבר קיים ב-`t22-save-bar` ✅

---

### 2025-07 — Premium SaaS UI Overhaul (commit: a268fe4)
**משימה:** שדרוג UI/UX מקיף — כותרות, כרטיסים, סטטיסטיקות — CSS/className בלבד

**קבצים ששונו:**

- `crm-app/src/app/dashboard/candidates/page.tsx`
  - Header: הוחלף ל-sticky white bar עם indigo-600 icon + orange CTA button
  - Search Card: `t22-card-soft + backdrop-blur` → `bg-white rounded-2xl border border-slate-100 shadow-sm`
  - Candidate cards: `border-slate-200/80 hover:border-[#06B6D4]/30 duration-300` → `border-slate-100 hover:border-indigo-200 shadow-sm hover:shadow-md hover:-translate-y-1 duration-200`
  - Outer container: הוסף div פנימי עם padding (עקב sticky header שנשלף מתוך ה-padding)

- `crm-app/src/app/dashboard/page.tsx`
  - Background: `var(--app-bg)` → `linear-gradient(135deg, #F0F4FF 0%, #EEF2FF 50%, #F5F3FF 100%)`
  - 3 כרטיסים גדולים (בתהליך/לא מתאים/התקבלו): header עם colored bg הוחלף ל-accent bar (w-2 h-10 rounded-full) + מספר גדול text-4xl מחוץ לתיבה
  - 5 כרטיסי סטטיסטיקות: `text-3xl` → `text-4xl font-black` + progress bar decorative (h-1 rounded-full) לכל כרטיס

- `crm-app/src/app/dashboard/candidates/[id]/page.tsx`
  - Header: `p-8 + flex justify-between` → premium card עם gradient avatar (indigo→violet) + שם גדול font-black text-2xl + כפתורים בתוך הכרטיס
  - Detail cards (פרטים אישיים, פרטי תעסוקה, קליטה לעבודה, הערות, תקציר): הוסף `rounded-2xl shadow-sm border border-slate-100 bg-white`

**הערות:**
- לא נגעו בלוגיקה, API, DB, TypeScript types
- Build עבר ✅ (exit code 0)
- Prisma DATABASE_URL error — pre-existing, נורמלי

---

## ✅ החלטות שהתקבלו

| תאריך | החלטה | סיבה |
|---|---|---|
| 2026-08-31 | לקוח חדש: טחנת האבן קואופ בע"מ — route ייעודי לכל לקוח | שמירה על מבנה עקבי של הוספת מעסיקים/משרות |
| 2026-09-03 | נמען ברירת מחדל להתראות סטטוס מועמדים: `CRM_NOTIFY_DEFAULT_EMAIL` = `office@hr22group.com` (במקום `22geder@gmail.com`). כל מיילי כניסה לתהליך / שינוי סטטוס / catch-all נשלחים ל-office. לא לשנות SMTP, Gmail scanner, replyTo למעסיקים, או env. | ריכוז התראות תפעול אצל המשרד; קוד מקומי עודכן, דורש deploy. אם ב-Railway מוגדר `CRM_NOTIFY_EMAIL` עם 22geder — לעדכן ידנית שם. |
| 2026-09-03 | בדיקה (קריאה בלבד, לא שונה קוד): מייל העלאת קורות חיים נשלח מכל מגייס — אין סינון לפי משתמש. `sendCandidateUploadEmail` אחרי שמירה מוצלחת ב-`/api/upload` (דרופזון, מובייל, Avigdor) וב-`POST /api/candidates` (יצירה ידנית / לוח גיוס). נמען: `getNotifyEmails()` → כעת `office@hr22group.com`. לא נשלח ב-confirmOnly, כפילות 409, או בסורק Gmail (`gmail-poll` / `email-auto` / `email-webhook` / `gmail-scan-history`). לא נדרש שינוי קוד למסלולי מגייסים. | אימות כיסוי התראות העלאה לכל המגייסים; סורק מיילים נשאר מחוץ למסלול הזה. |
| 2026-10-06 | מייל העלאה מכל מגייס: `sendCandidateUploadEmail` ב-`/api/upload` רץ fire-and-forget מיד אחרי שמירת המועמד ל-DB (לפני תגיות ו-auto-matching), בלי `await`. הקריאה הישנה בסוף ה-route הוסרה. נמען נשאר `office@hr22group.com`. דורש deploy לפרודקשן. | timeout/matching בסוף ה-route מנעו שליחת מייל כשמגייסים (למשל ליאל) מעלים מהדשבורד. |

---

## 🔄 יומן LOOP (תיקונים)

| תאריך | מה תוקן | קבצים |
|---|---|---|
| 2026-08-31 | Email catch-all בסטטוס מועמד — בלוק catch-all מוסיף שליחת `sendCandidateStatusChangeEmail` לכל סטטוס שלא היה מכוסה (INTERVIEW, OFFER, NEW, ACCEPTED וכו') | `src/app/api/candidates/[id]/route.ts` |
| 2026-09-02 | תיקון חזרה מפרופיל מועמד: נשמרים חיפוש, פילטרים, סטטוס, תצוגה, גלילה והמועמד האחרון ב-`sessionStorage`; מתבצע hydrate לפני fetch ושחזור עוגן לאחר טעינת הכרטיסים. בדיקות `test` ו-`build` עברו; `tsc` ו-`lint` עדיין מדווחים בעיות קיימות שאינן קשורות. סיכון ידוע: `sessionStorage` זמני ומבודד לכל tab. | `crm-app/src/app/dashboard/candidates/page.tsx`, `crm-app/src/components/advanced-filters.tsx` |
| 2026-09-02 | **משימה מאושרת והושלמה:** פתיחת פרופיל מועמד בטאב חדש מרשימת המועמדים, מחיפוש AI וממסך ההשוואה; פתיחת משרות קשורות בטאב חדש בפרופיל המועמד וברשימת ההתאמות. מנגנון `sessionStorage` נשמר כ-fallback לשחזור הרשימה, לרבות חיפוש, פילטרים, סטטוס, תצוגה, עוגן מועמד וגלילה; איפוס המצב אטומי ועוגן חסר נופל לגלילה השמורה. בדיקות שעברו: `get_errors`, `npm test` (46 tests), `npm run build`, `git diff --check`. `tsc` ו-`lint` ממשיכים לדווח שגיאות קיימות שאינן קשורות לשינוי. | `crm-app/src/app/dashboard/candidates/page.tsx`, `crm-app/src/components/advanced-filters.tsx`, `crm-app/src/components/ai-candidate-search.tsx`, `crm-app/src/app/dashboard/candidates/[id]/page.tsx`, `crm-app/src/components/matching-positions-list.tsx` |
| 2026-09-02 | נוצר route idempotent להוספה/עדכון שתי משרות ללקוח קיים בלבד `BeFree מערכות סיוע לנכים בע"מ`: `מנהל/ת משרד לחברה בכפר סבא` ו-`איש טכני אחזקה`. ה-route לא יוצר Employer; אם BeFree לא קיים מחזיר 404 ללא כתיבה. כתיבה מוגנת ב-`key=twenty2befree2026` + `confirm=add`, ו-`dryRun=1` לבדיקה ללא כתיבה. ולידציה: `get_errors` עבר; `npm run build` נעצר ב-`EBUSY` על `.next` לפני קומפילציה; `npx tsc --noEmit --pretty false | Select-String add-befree` לא מצא שגיאות. סטטוס: קוד מוכן, endpoint לא הופעל מול DB. | `crm-app/src/app/api/positions/add-befree/route.ts` |
| 2026-09-03 | שינוי יעד מיילי התראות סטטוס: `CRM_NOTIFY_DEFAULT_EMAIL` מ-`22geder@gmail.com` ל-`office@hr22group.com`. כל מיילי כניסה לתהליך / שינוי סטטוס / catch-all נשלחים כעת ל-office. עודכנו טסטי `getNotifyEmails` — 5/5 עברו. לא נגע ב-SMTP, Gmail scanner, תבניות, `.env`, replyTo למעסיקים. סטטוס: קוד עודכן מקומית; דורש deploy לפרודקשן. אם ב-Railway מוגדר `CRM_NOTIFY_EMAIL` עם 22geder — לעדכן ידנית שם. | `crm-app/src/lib/process-notifications.ts`, `crm-app/src/lib/__tests__/process-notifications.test.ts` |
| 2026-09-03 | בדיקה בלבד (לא שונה קוד): מייל העלאת קורות חיים מכל מגייס — אין סינון לפי משתמש. `sendCandidateUploadEmail` אחרי שמירה מוצלחת ב-`/api/upload` (דרופזון, מובייל, Avigdor) וב-`POST /api/candidates` (יצירה ידנית / לוח גיוס). נמען `getNotifyEmails()` → `office@hr22group.com`. לא נשלח ב-confirmOnly, כפילות 409, או בסורק Gmail (`gmail-poll` / `email-auto` / `email-webhook` / `gmail-scan-history`). לא נדרש שינוי קוד למסלולי מגייסים. | קריאה בלבד: `crm-app/src/app/api/upload`, `crm-app/src/app/api/candidates`, `gmail-poll` / `email-auto` / `email-webhook` / `gmail-scan-history` |
| 2026-09-03 | אביגדור שלב 1+2: חילוץ `pageContextFromPath` וציון מאצ'ינג מהיר לליבות נבדקות; route משתמש ב-`scoreCandidateAgainstPosition` בלי שינוי צורת החזרה. שלב 2: פלייבוק עברית `lookupCrmHowTo` + כלי `explain_crm` (קריאה בלבד, בלי נתונים חיים/PII). לא נגע ב-schema / `.env` / `advanced-matching.ts` / `gemini-ai.ts`. טסטים: 22/22. | `crm-app/src/lib/avigdor-page-context.ts`, `crm-app/src/lib/avigdor-fast-match.ts`, `crm-app/src/lib/avigdor-system-knowledge.ts`, `crm-app/src/app/api/avigdor-chat/route.ts`, `crm-app/src/components/avigdor-ai-panel.tsx`, טסטים תואמים |
| 2026-10-06 | תיקון מייל העלאה מכל מגייס: `sendCandidateUploadEmail` הועבר למיד אחרי שמירת המועמד ל-DB (fire-and-forget, בלי await), לפני תגיות ו-auto-matching. הקריאה הישנה בסוף ה-route נמחקה כדי ש-timeout/matching לא ימנעו מייל (למשל ליאל מהדשבורד). נמען נשאר `office@hr22group.com`. לא נשלח ב-confirmOnly/409. `get_errors` על הקובץ: ללא שגיאות. דורש deploy לפרודקשן. | `crm-app/src/app/api/upload/route.ts` |
| 2026-10-11 | **שדרוג העלאת משרות המונית (bulk):** צינור דטרמיניסטי — `job-text-extractors.ts` (נרמול, פיצול CRLF/Excel/משרה בודדת, שדות מתויגים, grounding, `looksUnreadable`, `buildPositionKeywords`); `job-import-parser.ts` כמקור אמת יחיד; `saveParsedJob` כמסלול שמירה יחיד (כולל כפילות + `allowDuplicate`); `bulk-parse`/`bulk-save` דקים עם zod ו-`{error,code}`; UI: כפילות, אזהרות, פאנל מקור, "זוהו N משרות", "מזג עם הקודמת". פירוט מלא בסעיף "שדרוג העלאת משרות המונית" למטה. vitest 48/48, `get_errors` נקי; `tsc` מציג רק שגיאות קיימות (Prisma client ישן: `gmailJobImport`, `lastJobScannedAt`). | `crm-app/src/lib/job-text-extractors.ts` (חדש), `job-import-parser.ts`, `job-position-save.ts`, `api/positions/bulk-parse\|bulk-save\|extract-text/route.ts`, `api/job-imports/[id]/review/route.ts`, `dashboard/positions/bulk-upload/page.tsx`, טסטים ב-`src/lib/__tests__/` |

| 2026-10-11 | **אימות שדרוג bulk (LOOP, איטרציה 1):** תוקן `matchFieldLine` — שורת שדות עם `\|` וחלק שאינו שדה מתויג (`מיקום: X \| משרה חלקית`, אמוג'י בחלק שני) לא חילצה מיקום/שכר; כעת מחלץ ושומר חלק לא מזוהה בתיאור מילה במילה. יושר `openings` ב-review ל-500; תוקנה הוראת UI ("שתי שורות ריקות" אינן מפצלות). vitest ייעודי 50/50. כשלי vitest כלליים (15 קבצים/485) קיימים מראש ואינם קשורים. | `job-text-extractors.ts`, `job-imports/[id]/review/route.ts`, `bulk-upload/page.tsx`, `job-text-extractors.test.ts` |
| 2026-10-18 | **עדכוני סטטוס מרשימות Gmail הושלמו:** `gmail-update-scan` יוצר הצעות `CandidateUpdate` ממתינות ל-`IN_PROCESS` מרשימות מגייסים, רק בהתאמת שם מלא ייחודית ושמרנית; שמות חלקיים או דו-משמעיים מדולגים. אישור סקירה שומר `employmentStatus=IN_PROCESS` ו-`inProcessAt` בלי להמציא משרה, וה-UI מציג את הסטטוס. בדיקות `gmail-status-proposals` ו-`candidate-update-review`: 7/7; `get_errors` נקי. ללא שינוי schema/env/deploy/DB. | `gmail-status-proposals.ts`, `gmail-update-scan/route.ts`, `candidate-updates/[id]/review/route.ts`, `candidate-updates/page.tsx`, בדיקות ממוקדות |

---

## שדרוג העלאת משרות המונית (bulk-upload) - 2026-10-11

**בעיות שאובחנו:**
- פיצול שגוי של הטקסט (CRLF / שורות ריקות)
- Gemini ללא `temperature` / `responseMimeType` עם 10 משרות בבקשה אחת
- הצמדת תוצאות למשרות לפי אינדקס
- `JSON.parse` ללא try
- אין grounding מול הטקסט המקורי
- bulk-save לא השתמש ב-`saveParsedJob` (אין בדיקת כפילות)

**החלטות:**
- `description` / `requirements` מילה במילה מהמקור
- Gemini רק לסיוע במבנה, batch של 3 משרות עם `id`
- grounding דטרמיניסטי במקום `validateTagsBatch`
- תגיות חדשות: type `POSITION`, צבע `#1d4ed8`, + תגיות מעסיק / עיר / סוג העסקה (עד 15)
- `active=false` כברירת מחדל
- כפילות (מעסיק + שם משרה) מדולגת אלא אם `allowDuplicate`
- `employmentType` 'לא צוין' ושדות ריקים נשמרים `null`
- טלפון איש קשר נשאר בתיאור

**קבצים:**
- `crm-app/src/lib/job-text-extractors.ts` (חדש)
- `crm-app/src/lib/job-import-parser.ts` (מקור אמת יחיד)
- `crm-app/src/lib/job-position-save.ts`
- `api/positions/bulk-parse`, `bulk-save`, `extract-text`
- `api/job-imports/[id]/review`
- `dashboard/positions/bulk-upload/page.tsx`
- שלוש סוויטות vitest (48/48 עוברות)

**הערות פתוחות:**
- `gmail-job-scan.ts` משתמש כעת בפרסר המשופר (טקסט דחוס לשורה אחת → בדרך כלל בלוק אחד)
- Prisma client ישן — דרוש `prisma generate` לפני build (בנפרד)
- ESLint `any` ב-`page.tsx` שורות ~101 ו-~217 היו קיימים מראש
- `npm run build` לא הורץ
- נדרשת בדיקה ידנית מול DB לא-פרודקשן: משרה בודדת, 3 משרות עם מפרידים, Excel, משרת נהגי מוניות
- לא בוצע deploy
- לא בוצע שינוי ב-`schema.prisma` / `package.json`

---

## 📜 היסטוריה מרכזית

| תאריך | אירוע |
|---|---|
| **2026-08-31** | תיקון: Email catch-all בסטטוס מועמד — הוספת בלוק catch-all ב-`candidates/[id]/route.ts` שמשגר `sendCandidateStatusChangeEmail` לכל שינוי סטטוס שלא היה מכוסה (INTERVIEW, OFFER, NEW, ACCEPTED וכו'), ל-22geder@gmail.com |
| **2026-09-03** | שינוי נמען התראות סטטוס מועמדים: `CRM_NOTIFY_DEFAULT_EMAIL` ב-`crm-app/src/lib/process-notifications.ts` מ-`22geder@gmail.com` ל-`office@hr22group.com`. טסטים ב-`process-notifications.test.ts` 5/5. לא שונו SMTP / Gmail scanner / replyTo / env. קוד מקומי; ממתין ל-deploy. |
| **2026-09-03** | בדיקה (קריאה בלבד): מייל העלאת קורות חיים מכל מגייס — אין סינון לפי משתמש. `sendCandidateUploadEmail` אחרי שמירה ב-`/api/upload` וב-`POST /api/candidates`. נמען `getNotifyEmails()` → `office@hr22group.com`. לא נשלח ב-confirmOnly / 409 / סורק Gmail. לא נדרש שינוי קוד. |
| **2026-10-06** | תיקון: מייל העלאה מכל מגייס — `sendCandidateUploadEmail` ב-`crm-app/src/app/api/upload/route.ts` הועבר למיד אחרי שמירת המועמד (fire-and-forget, בלי await), לפני תגיות ו-auto-matching; הקריאה בסוף ה-route הוסרה. נמען `office@hr22group.com`. דורש deploy. |
| **2026-11-05** | מודול חדש: פרסום בקבוצות פייסבוק (בהשראת ezpost.co.il, ללא העתקת קוד/נכסים). 8 מודלים ב-Prisma נדחפו ישירות ל-DB פרודקשן (`prisma db push`, אדיטיבי בלבד, אחרי גיבוי JSON מלא). Playwright נוסף כתלות + `chromium` ב-nixpacks.toml. ראה פירוט מלא בסעיף "משימות פתוחות" למטה. |

---

## 📌 משימות פתוחות

### ⏳ [2026-11-05] מודול פרסום בקבוצות פייסבוק — סטטוס: קוד מקומי מלא, ממתין ל-deploy + QA עם חשבון אמיתי

**מה הושלם (הכל מקומי, לא נפרס עדיין):**
- **DB (כבר רץ בפועל על פרודקשן! לא מקומי):** 8 מודלים חדשים (`FacebookAccount`, `FacebookGroup`, `FacebookGroupTemplate`, `FacebookPostTemplate`, `FacebookPost`, `FacebookSchedule`, `FacebookPublishLog`, `FacebookModuleSettings`) — נוצרו דרך `prisma db push` אחרי גיבוי JSON מלא (`C:\CRM-Backups\CRM-Backup-PreFacebookModule_2026-11-05_11-19.json`). אדיטיבי בלבד, נבדק שהדאטה הקיים שלם.
- `src/lib/facebook-session-crypto.ts` — הצפנת session (AES-256-GCM, נגזר מ-`NEXTAUTH_SECRET` הקיים — **אין צורך ב-env var חדש**)
- `src/lib/facebook-playwright.ts` — עטיפת Playwright (scrape קבוצות, פרסום לקבוצה, זיהוי checkpoint/captcha)
- `src/lib/facebook-schedule.ts` — חישוב `nextRunAt` ל-DAILY/WEEKLY עם timezone
- `src/lib/facebook-rate-limit.ts` — rate limiting בזיכרון
- `enhanceFacebookPostWithGemini` ב-`gemini-ai.ts` — שדרוג AI עם grounding check (דוחה טלפון/מייל/שכר מומצא)
- כל ה-API תחת `/api/facebook/*` (connect/status/disconnect/groups/groups-sync/group-templates/post-templates/posts/enhance-ai/schedules/publish-now/publish-log/settings) + `/api/cron/facebook-publish`
- קרון פנימי (node-cron) ב-`instrumentation.ts` — כל 10 דקות
- UI: `/dashboard/facebook-groups/*` (סקירה, חיבור, פוסט חדש, תזמונים, תבניות, לוג, הגדרות) + פריט ניווט "שיווק"
- סקריפט חיבור מקומי: `scripts/facebook-login-session.mjs`
- `package.json` + `nixpacks.toml` עודכנו (playwright + Chromium מ-Nix)
- 42 בדיקות vitest עוברות (הצפנה, grounding, rate-limit, nextRunAt, playwright helpers, לוגיקת הקרון המלאה עם מוקים)
- `npx tsc --noEmit` נקי (אין שגיאות facebook; 82 שגיאות pre-existing לא קשורות נשארו כפי שהיו)

**⚠️ סיכון ידוע (אושר ע"י המשתמש, לא לדון מחדש):** אין API רשמי של פייסבוק לפרסום אוטומטי בקבוצות (בוטל ב-2018). המימוש מבוסס אוטומציית דפדפן (Playwright) עם session אמיתי — מפר Automated Behavior Policy של פייסבוק, מסכן השעיית החשבון המחובר. מגבלות: 45 פרסומים/יום, 15 קבוצות/ריצה, השהיה אקראית 45-180 שניות, עצירה מיידית + השבתת כל התזמונים אם מתגלה checkpoint/captcha.

**נותר לביצוע (לא בוצע ע"י הסוכן - דורש גישה שאין לסוכן):**
1. **Deploy ל-Railway** (git commit + push את כל השינויים למעלה)
2. **הגדרת `CRON_SECRET` ב-Railway production** — חובה, אחרת הקרון הפנימי יחזיר 401 תמיד (ה-endpoint נכשל-סגור אם המשתנה חסר בפרודקשן, בכוונה)
3. **הרצת `node scripts/facebook-login-session.mjs` מקומית** ע"י המנהל, חיבור לחשבון הפייסבוק האישי (כולל 2FA), הדבקת ה-session במסך `/dashboard/facebook-groups/connect`
4. **QA עם חשבון אמיתי (Phase 8):** הסלקטורים מול facebook.com ב-`facebook-playwright.ts` הם best-effort (role/aria-label, לא class names) אך לא נבדקו מול DOM אמיתי — צפוי לדרוש כוונון אחרי חיבור חשבון אמיתי
5. בדיקה ויזואלית של מסכי ה-UI לא בוצעה (לא היו למסמן אישורי כניסה לפרודקשן כדי לא לנחש סיסמת מנהל) — לבדוק ידנית אחרי login
6. (היגיינה, לא חובה) `.facebook-state-*.json` הוסרו מ-`.gitignore` קדימה, אך נמצאו בהיסטוריית git — לא טופל

### ⏳ [2026-10-06] Deploy תיקון מייל העלאה מכל מגייס — סטטוס: קוד מקומי, ממתין לפרודקשן
- `sendCandidateUploadEmail` ב-`/api/upload` רץ מיד אחרי שמירת המועמד (fire-and-forget), לפני תגיות/matching
- נמען נשאר `office@hr22group.com`
- מטרה: timeout/matching לא ימנעו מייל כשמגייסים (למשל ליאל) מעלים מהדשבורד

### ⏳ [2026-09-03] Deploy נמען התראות סטטוס — סטטוס: קוד מקומי, ממתין לפרודקשן
- ברירת מחדל בקוד: `office@hr22group.com`
- אם ב-Railway מוגדר `CRM_NOTIFY_EMAIL` עם 22geder — לעדכן ידנית שם (ה-env גובר על ברירת המחדל בקוד)

### ✅ [2026-08-31] הוספת לקוח — טחנת האבן קואופ בע"מ — סטטוס: הושלם, ממתין להפעלת endpoint

**מה נוצר:**
- Route: `src/app/api/positions/add-stonemillcoop/route.ts`
- הפעלה: `GET /api/positions/add-stonemillcoop?key=twenty2stonemillcoop2026`
- מעסיק: טחנת האבן קואופ בע"מ | jobs@stonemillcoop.co.il | www.StoneMillCoop.com | רחובות
- משרה 1: נציג/ת מכירות טלפוניות — רחובות | 8,000 ₪ + עמלות עד 7,000 ₪
- משרה 2: מתאמ/ת ייבוא — רחובות | 12,000–14,000 ₪
- תגיות: ~40 תגיות עם צבעים לכל משרה

**להשלמה:** הרצת `GET /api/positions/add-stonemillcoop?key=twenty2stonemillcoop2026` בפרודקשן
