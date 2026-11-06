import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireApiUser } from "@/lib/api-authorization"
import { prisma } from "@/lib/prisma"
import { encryptFacebookSession } from "@/lib/facebook-session-crypto"
import { isRateLimited } from "@/lib/facebook-rate-limit"

const headers = { "Cache-Control": "private, no-store" }

// storageState מגיע מריצה ידנית מקומית של סקריפט Playwright headed (חיבור חד-פעמי, כולל 2FA ידני).
// מתקבל כאובייקט (לא קובץ) - גודלו נבדק לפני הצפנה כדי למנוע payloads חריגים.
const connectSchema = z.object({
  storageState: z.object({
    cookies: z.array(z.record(z.string(), z.any())).min(1),
    origins: z.array(z.record(z.string(), z.any())).optional(),
  }),
})

const MAX_STORAGE_STATE_BYTES = 2 * 1024 * 1024

export async function POST(request: NextRequest) {
  const authorization = await requireApiUser("ADMIN")
  if ("response" in authorization) return authorization.response

  if (isRateLimited(`facebook-connect:${authorization.user.id}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "יותר מדי ניסיונות חיבור - נסה שוב בעוד שעה" }, { status: 429, headers })
  }

  try {
    const body = await request.json()
    const parsed = connectSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "פורמט session לא תקין" }, { status: 400, headers })
    }

    const storageStateJson = JSON.stringify(parsed.data.storageState)
    if (Buffer.byteLength(storageStateJson, "utf8") > MAX_STORAGE_STATE_BYTES) {
      return NextResponse.json({ error: "קובץ ה-session גדול מדי (מקסימום 2MB)" }, { status: 400, headers })
    }

    const encryptedSession = encryptFacebookSession(storageStateJson)

    const existing = await prisma.facebookAccount.findFirst({ select: { id: true } })
    const account = existing
      ? await prisma.facebookAccount.update({
          where: { id: existing.id },
          data: {
            encryptedSession,
            status: "CONNECTED",
            connectedById: authorization.user.id,
            lastConnectedAt: new Date(),
          },
          select: { id: true, status: true, lastConnectedAt: true },
        })
      : await prisma.facebookAccount.create({
          data: {
            encryptedSession,
            status: "CONNECTED",
            connectedById: authorization.user.id,
          },
          select: { id: true, status: true, lastConnectedAt: true },
        })

    return NextResponse.json({ account }, { headers })
  } catch {
    // אין לחשוף תוכן session/cookies בלוג או בתשובה.
    console.error("[facebook-connect] Connection failed")
    return NextResponse.json({ error: "החיבור נכשל" }, { status: 500, headers })
  }
}
