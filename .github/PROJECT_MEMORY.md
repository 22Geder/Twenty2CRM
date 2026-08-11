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
