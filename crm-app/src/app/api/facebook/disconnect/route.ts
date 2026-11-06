import { NextResponse } from "next/server"
import { requireApiUser } from "@/lib/api-authorization"
import { prisma } from "@/lib/prisma"
import { isRateLimited } from "@/lib/facebook-rate-limit"

const headers = { "Cache-Control": "private, no-store" }

export async function POST() {
  const authorization = await requireApiUser("ADMIN")
  if ("response" in authorization) return authorization.response

  if (isRateLimited(`facebook-disconnect:${authorization.user.id}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "יותר מדי בקשות - נסה שוב מאוחר יותר" }, { status: 429, headers })
  }

  try {
    const account = await prisma.facebookAccount.findFirst({ select: { id: true } })
    if (!account) {
      return NextResponse.json({ disconnected: true }, { headers })
    }

    await prisma.$transaction([
      prisma.facebookAccount.update({
        where: { id: account.id },
        data: { status: "DISCONNECTED", encryptedSession: "" },
      }),
      prisma.facebookSchedule.updateMany({
        where: { active: true },
        data: { active: false, blockedReason: "SESSION_EXPIRED" },
      }),
    ])

    return NextResponse.json({ disconnected: true }, { headers })
  } catch {
    console.error("[facebook-disconnect] Disconnect failed")
    return NextResponse.json({ error: "הניתוק נכשל" }, { status: 500, headers })
  }
}
