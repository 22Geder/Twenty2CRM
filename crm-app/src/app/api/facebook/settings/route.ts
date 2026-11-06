import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireApiUser } from "@/lib/api-authorization"
import { prisma } from "@/lib/prisma"
import { isRateLimited } from "@/lib/facebook-rate-limit"

const headers = { "Cache-Control": "private, no-store" }

const updateSchema = z.object({
  active: z.boolean().optional(),
  dailyPublishLimit: z.number().int().min(1).max(500).optional(),
  delayMinSeconds: z.number().int().min(5).max(600).optional(),
  delayMaxSeconds: z.number().int().min(5).max(1200).optional(),
  maxGroupsPerRun: z.number().int().min(1).max(100).optional(),
  maxRunDurationMinutes: z.number().int().min(1).max(60).optional(),
})

async function getOrCreateSettings() {
  const existing = await prisma.facebookModuleSettings.findFirst()
  if (existing) return existing
  return prisma.facebookModuleSettings.create({ data: {} })
}

export async function GET() {
  const authorization = await requireApiUser("ADMIN")
  if ("response" in authorization) return authorization.response

  const settings = await getOrCreateSettings()
  return NextResponse.json({ settings }, { headers })
}

export async function PATCH(request: NextRequest) {
  const authorization = await requireApiUser("ADMIN")
  if ("response" in authorization) return authorization.response

  if (isRateLimited(`facebook-settings:${authorization.user.id}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "יותר מדי בקשות" }, { status: 429, headers })
  }

  try {
    const parsed = updateSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400, headers })
    }
    if (
      parsed.data.delayMinSeconds !== undefined &&
      parsed.data.delayMaxSeconds !== undefined &&
      parsed.data.delayMinSeconds > parsed.data.delayMaxSeconds
    ) {
      return NextResponse.json({ error: "השהיה מינימלית לא יכולה להיות גדולה מהמקסימלית" }, { status: 400, headers })
    }

    const current = await getOrCreateSettings()
    const settings = await prisma.facebookModuleSettings.update({
      where: { id: current.id },
      data: parsed.data,
    })
    return NextResponse.json({ settings }, { headers })
  } catch {
    console.error("[facebook-settings] Update failed")
    return NextResponse.json({ error: "העדכון נכשל" }, { status: 500, headers })
  }
}
