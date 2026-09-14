import { describe, expect, it } from "vitest"
import { getActiveNavigationHref, getDashboardBreadcrumbs } from "../dashboard-navigation"

const navigation = [
  { href: "/dashboard", exact: true },
  { href: "/dashboard/candidates" },
  { href: "/dashboard/positions" },
  { href: "/dashboard/positions/bulk-upload" },
  { href: "/dashboard/admin" },
  { href: "/dashboard/admin/hours-report" },
] as const

describe("getActiveNavigationHref", () => {
  it.each(["/dashboard", "/dashboard/"])("מתאים את לוח הבקרה במדויק: %s", (path) => {
    expect(getActiveNavigationHref(path, navigation)).toBe("/dashboard")
  })

  it("לא מסמן את לוח הבקרה בעמוד פנימי, גם בניווט מצומצם למובייל", () => {
    expect(getActiveNavigationHref("/dashboard/candidates/new", navigation)).toBe("/dashboard/candidates")
    expect(getActiveNavigationHref("/dashboard/candidates", [navigation[0]])).toBeUndefined()
  })

  it.each([
    "/dashboard/positions/bulk-upload",
    "/dashboard/positions/bulk-upload/",
    "/dashboard/positions/bulk-upload/preview",
  ])("בוחר רק את הנתיב הספציפי ביותר ללא תלות בסדר: %s", (path) => {
    expect(getActiveNavigationHref(path, navigation)).toBe("/dashboard/positions/bulk-upload")
    expect(getActiveNavigationHref(path, [...navigation].reverse())).toBe("/dashboard/positions/bulk-upload")
  })

  it("שומר התאמת הורה כשאין פריט ניווט ייעודי לעמוד הפנימי", () => {
    expect(getActiveNavigationHref("/dashboard/positions/550e8400-e29b-41d4-a716-446655440000/edit", navigation)).toBe("/dashboard/positions")
    expect(getActiveNavigationHref("/dashboard/positions/bulk-upload-old", navigation)).toBe("/dashboard/positions")
  })

  it.each(["/dashboard-old", "/dashboard/candidates-old", "/login"])(
    "לא מתאים תחיליות דומות או ילדים של פריט exact: %s",
    (path) => expect(getActiveNavigationHref(path, navigation)).toBeUndefined(),
  )

  it("מסמן דוח שעות כאדמין פנימי ספציפי", () => {
    expect(getActiveNavigationHref("/dashboard/admin/hours-report", navigation)).toBe("/dashboard/admin/hours-report")
    expect(getActiveNavigationHref("/dashboard/admin", navigation)).toBe("/dashboard/admin")
  })

  it.each([null, undefined, ""])("מחזיר ללא התאמה כשאין נתיב: %s", (path) => {
    expect(getActiveNavigationHref(path, navigation)).toBeUndefined()
  })

  it("תומך ברשימה ריקה ובקישורים עם לוכסן סופי בלי לשנות את הקלט", () => {
    const items = Object.freeze([Object.freeze({ href: "/dashboard/positions/" })])
    expect(getActiveNavigationHref("/dashboard", [])).toBeUndefined()
    expect(getActiveNavigationHref("/dashboard/positions/new/", items)).toBe("/dashboard/positions/")
    expect(items).toEqual([{ href: "/dashboard/positions/" }])
  })
})

describe("getDashboardBreadcrumbs", () => {
  it("בונה קישורים להורים ומסמן רק את הפירור האחרון", () => {
    expect(getDashboardBreadcrumbs("/dashboard/positions/bulk-upload/")).toEqual([
      { label: "לוח בקרה", href: "/dashboard", isLast: false },
      { label: "משרות", href: "/dashboard/positions", isLast: false },
      { label: "העלאה המונית", href: "/dashboard/positions/bulk-upload", isLast: true },
    ])
  })

  it.each([
    "550e8400-e29b-41d4-a716-446655440000",
    "550E8400-E29B-41D4-A716-446655440000",
    "550e8400%2De29b%2D41d4%2Da716%2D446655440000",
    "550e8400e29b41d4a716446655440000",
    "deadbeef",
  ])("מציג תווית פרטים למזהה במקום מזהה גולמי: %s", (id) => {
    const crumbs = getDashboardBreadcrumbs(`/dashboard/candidates/${id}/edit`)
    expect(crumbs[2]).toEqual({ label: "פרטים", href: `/dashboard/candidates/${id}`, isLast: false })
    expect(crumbs[3].label).toBe("עריכה")
  })

  it.each(["%", "%ZZ", "%E0%A4%A", "100%"])("לא נופל על קידוד פגום: %s", (segment) => {
    expect(getDashboardBreadcrumbs(`/dashboard/${segment}`)[1].label).toBe(segment)
  })

  it("מפענח עברית ושמות מוכרים בלי לפענח את הקישור", () => {
    const encoded = encodeURIComponent("תל אביב")
    expect(getDashboardBreadcrumbs(`/dashboard/%63andidates/${encoded}`)).toEqual([
      { label: "לוח בקרה", href: "/dashboard", isLast: false },
      { label: "מועמדים", href: "/dashboard/%63andidates", isLast: false },
      { label: "תל אביב", href: `/dashboard/%63andidates/${encoded}`, isLast: true },
    ])
  })

  it.each(["constructor", "__proto__", "toString", "abc123", "deadbeef-not-a-uuid", "שם חדש"])(
    "משאיר שמות לא מוכרים כטקסט רגיל: %s",
    (segment) => expect(getDashboardBreadcrumbs(`/dashboard/${segment}`)[1].label).toBe(segment),
  )

  it("מפענח פעם אחת בלבד ושומר לוכסנים ותווי HTML מקודדים בתוך מקטע הקישור", () => {
    const encoded = "name%2F%3Ctest%3E%2520"
    expect(getDashboardBreadcrumbs(`/dashboard/${encoded}`)[1]).toEqual({
      label: "name/<test>%20",
      href: `/dashboard/${encoded}`,
      isLast: true,
    })
  })

  it.each([null, undefined, ""])("משתמש בלוח הבקרה כשאין נתיב: %s", (path) => {
    expect(getDashboardBreadcrumbs(path)).toEqual([
      { label: "לוח בקרה", href: "/dashboard", isLast: true },
    ])
  })
})