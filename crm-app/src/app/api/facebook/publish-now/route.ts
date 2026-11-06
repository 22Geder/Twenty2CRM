import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireApiUser } from "@/lib/api-authorization"
import { prisma } from "@/lib/prisma"
import { isRateLimited } from "@/lib/facebook-rate-limit"

const headers = { "Cache-Control": "private, no-store" }

const requestSchema = z.object({
  postId: z.string().uuid(),
  groupIds: z.array(z.string().uuid()).min(1).optional(),
  groupTemplateId: z.string().uuid().optional(),
})

// פרסום "עכשיו" הוא בפועל Schedule מסוג ONCE עם nextRunAt=now; הקרון מבצע בפועל (עד תקרת קבוצות/ריצה).
// אם מספר הקבוצות חורג מהמכסה היומית - לא דוחים את הבקשה, רק מחזירים הערכת ימים (הקרון עצמו מפזר אוטומטית).
export async function POST(request: NextRequest) {
  const authorization = await requireApiUser("ADMIN")
  if ("response" in authorization) return authorization.response

  if (isRateLimited(`facebook-publish-now:${authorization.user.id}`, 3, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "יותר מדי בקשות פרסום מיידי - נסה שוב בעוד שעה" }, { status: 429, headers })
  }

  const account = await prisma.facebookAccount.findFirst({ select: { status: true } })
  if (!account || account.status !== "CONNECTED") {
    return NextResponse.json({ error: "אין חשבון פייסבוק מחובר" }, { status: 400, headers })
  }

  try {
    const parsed = requestSchema.safeParse(await request.json())
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
      const activeGroups = await prisma.facebookGroup.findMany({ where: { id: { in: data.groupIds! }, active: true }, select: { id: true } })
      resolvedGroupIds = activeGroups.map((g) => g.id)
    }

    if (resolvedGroupIds.length === 0) {
      return NextResponse.json({ error: "אין קבוצות פעילות לפרסום" }, { status: 400, headers })
    }

    const settings = await prisma.facebookModuleSettings.findFirst({ select: { dailyPublishLimit: true, maxGroupsPerRun: true } })
    const dailyLimit = settings?.dailyPublishLimit ?? 45
    const estimatedDays = Math.max(1, Math.ceil(resolvedGroupIds.length / dailyLimit))

    const schedule = await prisma.facebookSchedule.create({
      data: {
        postId: data.postId,
        groupIds: JSON.stringify(resolvedGroupIds),
        groupTemplateId: data.groupTemplateId,
        type: "ONCE",
        scheduledAt: new Date(),
        nextRunAt: new Date(),
      },
    })

    await prisma.facebookPost.update({ where: { id: data.postId }, data: { status: "SCHEDULED" } })

    return NextResponse.json({
      scheduleId: schedule.id,
      groupCount: resolvedGroupIds.length,
      estimatedDays,
      message: estimatedDays > 1
        ? `הפרסום יתפזר על פני כ-${estimatedDays} ימים בשל מגבלת ${dailyLimit} פרסומים ביום`
        : "הפרסום יתחיל בריצת הקרון הקרובה (עד 10 דקות)",
    }, { status: 201, headers })
  } catch {
    console.error("[facebook-publish-now] Failed")
    return NextResponse.json({ error: "הבקשה נכשלה" }, { status: 500, headers })
  }
}
