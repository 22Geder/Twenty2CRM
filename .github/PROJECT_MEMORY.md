# TWENTY2CRM — PROJECT MEMORY

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
