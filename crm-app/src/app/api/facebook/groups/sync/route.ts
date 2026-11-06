import { NextResponse } from "next/server"
import type { Browser } from "playwright"
import { requireApiUser } from "@/lib/api-authorization"
import { prisma } from "@/lib/prisma"
import { decryptFacebookSession } from "@/lib/facebook-session-crypto"
import { isRateLimited } from "@/lib/facebook-rate-limit"
import { launchFacebookBrowser, createFacebookContext, scrapeJoinedGroups, isBlockedIndicatorUrl } from "@/lib/facebook-playwright"

const headers = { "Cache-Control": "private, no-store" }

export async function POST() {
  const authorization = await requireApiUser("ADMIN")
  if ("response" in authorization) return authorization.response

  // מגבלה גלובלית (לא פר-משתמש) - זו פעולת scrape יקרה שלא צריכה לרוץ יותר מפעם ב-10 דקות.
  if (isRateLimited("facebook-groups-sync:global", 1, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "סנכרון כבר רץ לאחרונה - נסה שוב בעוד כמה דקות" }, { status: 429, headers })
  }

  const account = await prisma.facebookAccount.findFirst({
    select: { id: true, encryptedSession: true, status: true },
  })
  if (!account || account.status !== "CONNECTED" || !account.encryptedSession) {
    return NextResponse.json({ error: "אין חשבון פייסבוק מחובר" }, { status: 400, headers })
  }

  let browser: Browser | undefined
  try {
    const storageStateJson = decryptFacebookSession(account.encryptedSession)
    browser = await launchFacebookBrowser()
    const context = await createFacebookContext(browser, storageStateJson)

    const scraped = await scrapeJoinedGroups(context)

    const now = new Date()
    const scrapedIds = new Set(scraped.map((g) => g.facebookGroupId))

    await prisma.$transaction([
      ...scraped.map((group) =>
        prisma.facebookGroup.upsert({
          where: { accountId_facebookGroupId: { accountId: account.id, facebookGroupId: group.facebookGroupId } },
          update: { name: group.name, url: group.url, memberCount: group.memberCount, active: true, missedSyncCount: 0, lastSeenAt: now, lastSyncedAt: now },
          create: { accountId: account.id, facebookGroupId: group.facebookGroupId, name: group.name, url: group.url, memberCount: group.memberCount, lastSeenAt: now, lastSyncedAt: now },
        })
      ),
      prisma.facebookAccount.update({ where: { id: account.id }, data: { lastSyncedGroupsAt: now, lastUsedAt: now } }),
    ])

    // קבוצות שלא הופיעו בסנכרון הנוכחי - מעלים missedSyncCount; אחרי 2 פעמים רצופות מסמנים כלא פעילות.
    const existingGroups = await prisma.facebookGroup.findMany({
      where: { accountId: account.id, facebookGroupId: { notIn: [...scrapedIds] } },
      select: { id: true, missedSyncCount: true },
    })
    await Promise.all(
      existingGroups.map((group) =>
        prisma.facebookGroup.update({
          where: { id: group.id },
          data: {
            missedSyncCount: group.missedSyncCount + 1,
            active: group.missedSyncCount + 1 < 2,
          },
        })
      )
    )

    return NextResponse.json({ syncedCount: scraped.length }, { headers })
  } catch (error) {
    const blocked = error instanceof Error && (error.message === "BLOCKED_INDICATOR" || isBlockedIndicatorUrl(error.message))
    if (blocked) {
      await prisma.facebookAccount.update({ where: { id: account.id }, data: { status: "SUSPECTED_BLOCKED" } })
      await prisma.facebookSchedule.updateMany({ where: { active: true }, data: { active: false, blockedReason: "SUSPECTED_BLOCK" } })
      const admin = await prisma.user.findFirst({ where: { role: "ADMIN" }, select: { id: true } })
      if (admin) {
        await prisma.notification.create({
          data: {
            title: "חשד לחסימת חשבון פייסבוק",
            message: "זוהה סימן חסימה (checkpoint/captcha) בזמן סנכרון קבוצות. הפרסום הושבת אוטומטית.",
            type: "SYSTEM",
            userId: admin.id,
          },
        }).catch(() => {})
      }
    }
    console.error("[facebook-groups-sync] Sync failed")
    return NextResponse.json({ error: "סנכרון הקבוצות נכשל" }, { status: 500, headers })
  } finally {
    await browser?.close().catch(() => {})
  }
}
