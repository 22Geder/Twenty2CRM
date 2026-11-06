import { NextRequest, NextResponse } from "next/server"
import type { Browser } from "playwright"
import { timingSafeEqual } from "node:crypto"
import { prisma } from "@/lib/prisma"
import { decryptFacebookSession } from "@/lib/facebook-session-crypto"
import { launchFacebookBrowser, createFacebookContext, publishPostToGroup, randomDelayMs, sleep } from "@/lib/facebook-playwright"

// Force Node.js runtime (not Edge) - נדרש ל-Playwright ול-Prisma.
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const headers = { "Cache-Control": "private, no-store" }

function isAuthorizedCron(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET
  if (!expected) return process.env.NODE_ENV !== "production" // בפיתוח בלבד מותר בלי secret
  const received = request.headers.get("X-Cron-Secret") || ""
  const expectedBuf = Buffer.from(expected)
  const receivedBuf = Buffer.from(received)
  if (expectedBuf.length !== receivedBuf.length) return false
  return timingSafeEqual(expectedBuf, receivedBuf)
}

async function notifyAdmins(title: string, message: string) {
  const admins = await prisma.user.findMany({ where: { role: "ADMIN", active: true }, select: { id: true } })
  await Promise.all(
    admins.map((admin) =>
      prisma.notification.create({ data: { title, message, type: "SYSTEM", userId: admin.id } }).catch(() => {})
    )
  )
}

// GET /api/cron/facebook-publish - נקרא כל 10 דקות (node-cron פנימי, ראה instrumentation.ts).
// מבצע ריצה בודדת: בוחר schedule אחד שממתין, מפרסם עד תקרת קבוצות/זמן/מכסה יומית, עם השהיה אנושית בין קבוצות.
export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers })
  }

  const startedAt = Date.now()
  const settings = await prisma.facebookModuleSettings.findFirst()
  if (settings && !settings.active) {
    return NextResponse.json({ skipped: true, reason: "MODULE_DISABLED" }, { headers })
  }
  const dailyLimit = settings?.dailyPublishLimit ?? 45
  const delayMinSeconds = settings?.delayMinSeconds ?? 45
  const delayMaxSeconds = settings?.delayMaxSeconds ?? 180
  const maxGroupsPerRun = settings?.maxGroupsPerRun ?? 15
  const maxRunDurationMs = (settings?.maxRunDurationMinutes ?? 20) * 60 * 1000

  const account = await prisma.facebookAccount.findFirst()
  if (!account || account.status !== "CONNECTED" || !account.encryptedSession) {
    return NextResponse.json({ skipped: true, reason: "NOT_CONNECTED" }, { headers })
  }

  // שחרור כפוי של נעילה שנתקעה (timeout) - 5 דקות נוספות מעבר למגבלת זמן הריצה.
  if (account.isPublishing && account.publishingLockedAt) {
    const lockAgeMs = Date.now() - new Date(account.publishingLockedAt).getTime()
    if (lockAgeMs > maxRunDurationMs + 5 * 60 * 1000) {
      await prisma.facebookAccount.update({ where: { id: account.id }, data: { isPublishing: false, publishingLockedAt: null } })
      account.isPublishing = false
    }
  }
  if (account.isPublishing) {
    return NextResponse.json({ skipped: true, reason: "ALREADY_RUNNING" }, { headers })
  }

  // איפוס מכסה יומית אם עברנו ליום חדש
  const today = new Date().toDateString()
  const countsToday = account.publishCounterDate && new Date(account.publishCounterDate).toDateString() === today
  let publishesToday = countsToday ? account.publishesToday : 0
  if (!countsToday) {
    await prisma.facebookAccount.update({ where: { id: account.id }, data: { publishesToday: 0, publishCounterDate: new Date() } })
  }
  const remainingToday = dailyLimit - publishesToday
  if (remainingToday <= 0) {
    return NextResponse.json({ skipped: true, reason: "DAILY_LIMIT_REACHED" }, { headers })
  }

  const schedule = await prisma.facebookSchedule.findFirst({
    where: { active: true, status: { in: ["PENDING", "RUNNING"] }, nextRunAt: { lte: new Date() } },
    orderBy: [{ nextRunAt: "asc" }, { createdAt: "asc" }],
    include: { post: true },
  })
  if (!schedule) {
    return NextResponse.json({ skipped: true, reason: "NO_SCHEDULE_DUE" }, { headers })
  }

  await prisma.facebookAccount.update({ where: { id: account.id }, data: { isPublishing: true, publishingLockedAt: new Date() } })
  await prisma.facebookSchedule.update({ where: { id: schedule.id }, data: { status: "RUNNING" } })

  const runId = `${schedule.id}-${Date.now()}`
  const allGroupIds: string[] = JSON.parse(schedule.groupIds)

  // קבוצות שעוד לא עברו בהצלחה ב-runId הזה (מאפשר המשכיות אם ריצה קודמת נעצרה באמצע)
  const alreadyLogged = await prisma.facebookPublishLog.findMany({
    where: { scheduleId: schedule.id, status: "SUCCESS" },
    select: { groupId: true },
  })
  const alreadyPublishedGroupIds = new Set(alreadyLogged.map((l) => l.groupId))
  const pendingGroupIds = allGroupIds.filter((id) => !alreadyPublishedGroupIds.has(id))

  const groupsThisRun = pendingGroupIds.slice(0, Math.min(maxGroupsPerRun, remainingToday))
  const groups = await prisma.facebookGroup.findMany({ where: { id: { in: groupsThisRun }, active: true } })

  const content = schedule.post.useEnhanced && schedule.post.enhancedContent ? schedule.post.enhancedContent : schedule.post.originalContent
  const mediaUrls: string[] = schedule.post.mediaUrls ? JSON.parse(schedule.post.mediaUrls) : []

  let browser: Browser | undefined
  let successCount = 0
  let blockedDetected = false

  try {
    browser = await launchFacebookBrowser()
    const storageStateJson = decryptFacebookSession(account.encryptedSession)
    const context = await createFacebookContext(browser, storageStateJson)

    for (const group of groups) {
      if (Date.now() - startedAt > maxRunDurationMs) break // תקרת זמן ריצה - הקבוצות שנותרו ימתינו לריצה הבאה

      await prisma.facebookPublishLog.create({
        data: { postId: schedule.postId, groupId: group.id, scheduleId: schedule.id, runId, status: "PENDING", attemptedAt: new Date() },
      })

      const result = await publishPostToGroup(context, group.url, content, mediaUrls)

      if (result.blocked) {
        blockedDetected = true
        await prisma.facebookPublishLog.updateMany({
          where: { scheduleId: schedule.id, groupId: group.id, runId },
          data: { status: "FAILED", completedAt: new Date(), errorMessage: "BLOCKED_INDICATOR" },
        })
        break // עצירה מיידית - לא ממשיכים לקבוצה הבאה
      }

      await prisma.facebookPublishLog.updateMany({
        where: { scheduleId: schedule.id, groupId: group.id, runId },
        data: {
          status: result.success ? "SUCCESS" : "FAILED",
          completedAt: new Date(),
          errorMessage: result.success ? null : (result.error || "UNKNOWN_ERROR"),
        },
      })

      if (result.success) {
        successCount++
        publishesToday++
        await prisma.facebookAccount.update({ where: { id: account.id }, data: { publishesToday, lastUsedAt: new Date() } })
      }

      if (group.id !== groups[groups.length - 1]?.id) {
        await sleep(randomDelayMs(delayMinSeconds, delayMaxSeconds))
      }
    }
  } catch (error) {
    console.error("[cron/facebook-publish] Run failed:", error instanceof Error ? error.message : "unknown")
  } finally {
    await browser?.close().catch(() => {})
  }

  const totalPublishedSoFar = alreadyPublishedGroupIds.size + successCount
  const allDone = totalPublishedSoFar >= allGroupIds.length

  if (blockedDetected) {
    await prisma.facebookAccount.update({ where: { id: account.id }, data: { status: "SUSPECTED_BLOCKED", isPublishing: false, publishingLockedAt: null } })
    await prisma.facebookSchedule.updateMany({ where: { active: true }, data: { active: false, blockedReason: "SUSPECTED_BLOCK" } })
    await notifyAdmins(
      "חשד לחסימת חשבון פייסבוק - הפרסום הושבת",
      "זוהה סימן חסימה (checkpoint/captcha) בזמן פרסום. כל התזמונים הושבתו אוטומטית. יש לחבר מחדש את החשבון לפני המשך."
    )
    return NextResponse.json({ blocked: true, successCount, scheduleId: schedule.id }, { headers })
  }

  await prisma.facebookAccount.update({ where: { id: account.id }, data: { isPublishing: false, publishingLockedAt: null } })

  if (allDone) {
    if (schedule.type === "ONCE") {
      await prisma.facebookSchedule.update({ where: { id: schedule.id }, data: { status: "COMPLETED" } })
      await prisma.facebookPost.update({ where: { id: schedule.postId }, data: { status: successCount < groups.length ? "PARTIALLY_COMPLETED" : "COMPLETED" } })
    } else {
      // RECURRING: מחשבים ביחס ל-now בסיום הריצה (לא ביחס ל-nextRunAt הקודם) - מונע drift
      const { computeNextRunAt } = await import("@/lib/facebook-schedule")
      const rule = JSON.parse(schedule.recurrenceRule || "{}")
      await prisma.facebookSchedule.update({
        where: { id: schedule.id },
        data: { status: "PENDING", nextRunAt: computeNextRunAt(rule, new Date()) },
      })
    }
  } else {
    // נותרו קבוצות - משאירים PENDING/RUNNING, הריצה הבאה (עוד 10 דק') תמשיך מאיפה שעצרנו
    await prisma.facebookSchedule.update({ where: { id: schedule.id }, data: { status: "PENDING" } })
  }

  return NextResponse.json({
    scheduleId: schedule.id,
    successCount,
    remainingGroups: allGroupIds.length - totalPublishedSoFar,
    allDone,
    durationMs: Date.now() - startedAt,
  }, { headers })
}
