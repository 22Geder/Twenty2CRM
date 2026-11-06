import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireApiUser } from "@/lib/api-authorization"
import { prisma } from "@/lib/prisma"
import { computeNextRunAt } from "@/lib/facebook-schedule"
import { isRateLimited } from "@/lib/facebook-rate-limit"

const headers = { "Cache-Control": "private, no-store" }

const baseSchema = z.object({
  postId: z.string().uuid(),
  groupIds: z.array(z.string().uuid()).min(1).optional(),
  groupTemplateId: z.string().uuid().optional(),
  type: z.enum(["ONCE", "RECURRING"]),
  scheduledAt: z.string().datetime().optional(),
  recurrenceRule: z
    .object({
      frequency: z.enum(["DAILY", "WEEKLY"]),
      time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
      daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
      timezone: z.string().optional(),
    })
    .optional(),
})

function serialize(schedule: { groupIds: string; recurrenceRule: string | null; [key: string]: unknown }) {
  return {
    ...schedule,
    groupIds: JSON.parse(schedule.groupIds),
    recurrenceRule: schedule.recurrenceRule ? JSON.parse(schedule.recurrenceRule) : null,
  }
}

export async function GET() {
  const authorization = await requireApiUser("ADMIN")
  if ("response" in authorization) return authorization.response

  const schedules = await prisma.facebookSchedule.findMany({
    where: { post: { createdById: authorization.user.id } },
    include: { post: { select: { id: true, label: true, originalContent: true } } },
    orderBy: { nextRunAt: "asc" },
  })
  return NextResponse.json({ schedules: schedules.map(serialize) }, { headers })
}

export async function POST(request: NextRequest) {
  const authorization = await requireApiUser("ADMIN")
  if ("response" in authorization) return authorization.response

  if (isRateLimited(`facebook-schedules:${authorization.user.id}`, 20, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "יותר מדי תזמונים נוצרו - נסה שוב מאוחר יותר" }, { status: 429, headers })
  }

  try {
    const parsed = baseSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400, headers })
    }
    const data = parsed.data

    if (!data.groupIds && !data.groupTemplateId) {
      return NextResponse.json({ error: "יש לבחור קבוצות או תבנית קבוצות" }, { status: 400, headers })
    }
    if (data.groupIds && data.groupTemplateId) {
      return NextResponse.json({ error: "יש לבחור קבוצות ידנית *או* תבנית, לא שניהם" }, { status: 400, headers })
    }
    if (data.type === "ONCE" && !data.scheduledAt) {
      return NextResponse.json({ error: "חובה תאריך/שעה לתזמון חד-פעמי" }, { status: 400, headers })
    }
    if (data.type === "RECURRING" && !data.recurrenceRule) {
      return NextResponse.json({ error: "חובה חוק חזרה לתזמון מחזורי" }, { status: 400, headers })
    }
    if (data.type === "RECURRING" && data.recurrenceRule?.frequency === "WEEKLY" && !data.recurrenceRule.daysOfWeek?.length) {
      return NextResponse.json({ error: "חובה לבחור ימים בשבוע לתזמון מחזורי שבועי" }, { status: 400, headers })
    }

    const post = await prisma.facebookPost.findFirst({ where: { id: data.postId, createdById: authorization.user.id } })
    if (!post) return NextResponse.json({ error: "פוסט לא נמצא" }, { status: 404, headers })

    let resolvedGroupIds: string[]
    if (data.groupTemplateId) {
      const template = await prisma.facebookGroupTemplate.findFirst({
        where: { id: data.groupTemplateId, createdById: authorization.user.id },
        include: { groups: { select: { id: true, active: true } } },
      })
      if (!template) return NextResponse.json({ error: "תבנית קבוצות לא נמצאה" }, { status: 404, headers })
      resolvedGroupIds = template.groups.filter((g) => g.active).map((g) => g.id)
    } else {
      const activeGroups = await prisma.facebookGroup.findMany({
        where: { id: { in: data.groupIds! }, active: true },
        select: { id: true },
      })
      resolvedGroupIds = activeGroups.map((g) => g.id)
    }

    if (resolvedGroupIds.length === 0) {
      return NextResponse.json({ error: "אין קבוצות פעילות לפרסום" }, { status: 400, headers })
    }

    const nextRunAt = data.type === "ONCE" ? new Date(data.scheduledAt!) : computeNextRunAt(data.recurrenceRule!)

    const schedule = await prisma.facebookSchedule.create({
      data: {
        postId: data.postId,
        groupIds: JSON.stringify(resolvedGroupIds),
        groupTemplateId: data.groupTemplateId,
        type: data.type,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        recurrenceRule: data.recurrenceRule ? JSON.stringify(data.recurrenceRule) : null,
        nextRunAt,
      },
    })

    await prisma.facebookPost.update({ where: { id: data.postId }, data: { status: "SCHEDULED" } })

    return NextResponse.json({ schedule: serialize(schedule) }, { status: 201, headers })
  } catch {
    console.error("[facebook-schedules] Create failed")
    return NextResponse.json({ error: "יצירת התזמון נכשלה" }, { status: 500, headers })
  }
}
