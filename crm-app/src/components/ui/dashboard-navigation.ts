type NavigationTarget = {
  href: string
  exact?: boolean
}

// התאמה לפי גבולות נתיב; רק הפריט הספציפי ביותר מסומן כפעיל.
export function getActiveNavigationHref(
  pathname: string | null | undefined,
  items: readonly NavigationTarget[],
): string | undefined {
  if (!pathname) return undefined

  const path = pathname.replace(/\/+$/, "") || "/"
  let activeHref: string | undefined
  let longestMatch = -1

  for (const item of items) {
    const href = item.href.replace(/\/+$/, "") || "/"
    const matches = path === href || (
      !item.exact && href !== "/" && path.startsWith(href + "/")
    )

    if (matches && href.length > longestMatch) {
      activeHref = item.href
      longestMatch = href.length
    }
  }

  return activeHref
}

const segmentLabels: Record<string, string> = {
  dashboard: "לוח בקרה",
  candidates: "מועמדים",
  positions: "משרות",
  employers: "מעסיקים",
  interviews: "ראיונות",
  settings: "הגדרות",
  upload: "העלאה המונית",
  "recruitment-board": "הכנסת מועמד",
  "monthly-status": "סטטוס חודשי / שנתי",
  "share-agent": "Share Agent",
  attendance: "שעון נוכחות",
  "system-registry": "פנקס רישום",
  "bulk-upload": "העלאה המונית",
  admin: "ניהול אדמין",
  "hours-report": "דוח שעות",
  new: "חדש",
  edit: "עריכה",
  reports: "דוחות",
  tasks: "משימות",
  reminders: "תזכורות",
  templates: "תבניות",
  "smart-matching": "התאמה חכמה",
  "send-candidate": "שליחת מועמד",
  hired: "מועמדים שגויסו",
  kanban: "פייפליין Kanban",
  "bulk-broadcast": "שליחה המונית",
  activity: "היסטוריית פעילות",
  "facebook-import": "העלאה מפייסבוק",
  "job-posting-bot": "בוט פרסום קבוצות",
  "email-auto-scanner": "סורק מיילים",
  "gmail-auto": "קליטת Gmail",
  "gmail-setup": "הגדרת Gmail",
  "email-auto": "מיילים אוטומטיים",
  messages: "הודעות",
  "backup-rescue": "חילוץ גיבוי",
  "calendar-setup": "חיבור יומן",
}

function labelFor(segment: string): string {
  let decoded = segment
  try {
    decoded = decodeURIComponent(segment)
  } catch {
    // נתיב עם קידוד פגום נשאר טקסט רגיל ולא מפיל את סרגל הניווט.
  }

  if (Object.prototype.hasOwnProperty.call(segmentLabels, decoded)) {
    return segmentLabels[decoded]
  }
  if (/^[0-9a-f]{8,}$/i.test(decoded) || /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(decoded)) {
    return "פרטים"
  }
  return decoded
}

export function getDashboardBreadcrumbs(pathname: string | null | undefined) {
  const segments = (pathname || "/dashboard").split("/").filter(Boolean)
  return segments.map((segment, index) => ({
    label: labelFor(segment),
    // מפענחים רק את התווית; הקישור שומר את מקטעי הנתיב המקוריים.
    href: "/" + segments.slice(0, index + 1).join("/"),
    isLast: index === segments.length - 1,
  }))
}