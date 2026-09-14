import { describe, expect, it } from "vitest"
import { dashboardNavGroups, dashboardNavItems } from "../dashboard-nav-items"

describe("dashboardNavItems", () => {
  it("חושף את כל המסכים החבויים בניווט", () => {
    const hrefs = dashboardNavItems.map((item) => item.href)
    expect(hrefs).toEqual(expect.arrayContaining([
      "/dashboard",
      "/dashboard/candidates",
      "/dashboard/hired",
      "/dashboard/kanban",
      "/dashboard/positions",
      "/dashboard/employers",
      "/dashboard/interviews",
      "/dashboard/recruitment-board",
      "/dashboard/upload",
      "/dashboard/positions/bulk-upload",
      "/dashboard/send-candidate",
      "/dashboard/bulk-broadcast",
      "/dashboard/monthly-status",
      "/dashboard/share-agent",
      "/dashboard/attendance",
      "/dashboard/system-registry",
      "/dashboard/reports",
      "/dashboard/activity",
      "/dashboard/templates",
      "/dashboard/reminders",
      "/dashboard/tasks",
      "/dashboard/messages",
      "/dashboard/email-auto-scanner",
      "/dashboard/gmail-auto",
      "/dashboard/gmail-setup",
      "/dashboard/email-auto",
      "/dashboard/calendar-setup",
      "/dashboard/facebook-import",
      "/dashboard/job-posting-bot",
      "/dashboard/smart-matching",
      "/dashboard/settings",
      "/dashboard/backup-rescue",
    ]))
  })

  it("לא כולל כפילויות בכתובות", () => {
    const hrefs = dashboardNavItems.map((item) => item.href)
    expect(new Set(hrefs).size).toBe(hrefs.length)
  })

  it("מחלק לקבוצות עם תוויות בעברית", () => {
    expect(dashboardNavGroups.map((group) => group.label)).toEqual([
      "ניהול",
      "כלים",
      "מעקב",
      "מייל ויומן",
      "פרסום ו-AI",
      "מערכת",
    ])
  })
})
