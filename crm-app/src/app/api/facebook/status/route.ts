import { NextResponse } from "next/server"
import { requireApiUser } from "@/lib/api-authorization"
import { prisma } from "@/lib/prisma"

const headers = { "Cache-Control": "private, no-store" }

// סטטוס חיבור + מכסת פרסום נותרת - לעולם לא כולל שדות ההצפנה (encryptedSession/sessionIv/וכו').
export async function GET() {
  const authorization = await requireApiUser("ADMIN")
  if ("response" in authorization) return authorization.response

  try {
    const account = await prisma.facebookAccount.findFirst({
      select: {
        id: true,
        status: true,
        isPublishing: true,
        publishesToday: true,
        publishCounterDate: true,
        lastConnectedAt: true,
        lastUsedAt: true,
        lastSyncedGroupsAt: true,
        connectedBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    if (!account) {
      return NextResponse.json({ connected: false }, { headers })
    }

    const settings = await prisma.facebookModuleSettings.findFirst({ select: { dailyPublishLimit: true } })
    const dailyLimit = settings?.dailyPublishLimit ?? 45
    const today = new Date().toDateString()
    const countsToday = account.publishCounterDate && new Date(account.publishCounterDate).toDateString() === today
    const publishesToday = countsToday ? account.publishesToday : 0

    return NextResponse.json({
      connected: account.status === "CONNECTED",
      status: account.status,
      isPublishing: account.isPublishing,
      publishesToday,
      dailyLimit,
      remainingToday: Math.max(0, dailyLimit - publishesToday),
      lastConnectedAt: account.lastConnectedAt,
      lastUsedAt: account.lastUsedAt,
      lastSyncedGroupsAt: account.lastSyncedGroupsAt,
      connectedByName: account.connectedBy?.name ?? null,
    }, { headers })
  } catch {
    console.error("[facebook-status] Failed to load status")
    return NextResponse.json({ error: "שגיאה בטעינת הסטטוס" }, { status: 500, headers })
  }
}
