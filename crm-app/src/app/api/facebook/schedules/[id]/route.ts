import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireApiUser } from "@/lib/api-authorization"
import { prisma } from "@/lib/prisma"

const headers = { "Cache-Control": "private, no-store" }
const updateSchema = z.object({ active: z.boolean() })

async function loadOwnedSchedule(id: string, userId: string) {
  return prisma.facebookSchedule.findFirst({
    where: { id, post: { createdById: userId } },
  })
}

// PATCH: השהיה (active:false) / חידוש (active:true) של תזמון. אין עריכת תוכן/קבוצות דרך הנתיב הזה.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authorization = await requireApiUser("ADMIN")
  if ("response" in authorization) return authorization.response
  const { id } = await params

  const existing = await loadOwnedSchedule(id, authorization.user.id)
  if (!existing) return NextResponse.json({ error: "תזמון לא נמצא" }, { status: 404, headers })

  try {
    const parsed = updateSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400, headers })
    }

    if (parsed.data.active && existing.blockedReason === "SUSPECTED_BLOCK") {
      return NextResponse.json({ error: "לא ניתן לחדש תזמון שהושבת עקב חשד לחסימת חשבון - חבר מחדש את החשבון קודם" }, { status: 409, headers })
    }

    const schedule = await prisma.facebookSchedule.update({
      where: { id },
      data: { active: parsed.data.active, ...(parsed.data.active ? { blockedReason: null } : {}) },
    })
    return NextResponse.json({ schedule }, { headers })
  } catch {
    console.error("[facebook-schedules] Update failed")
    return NextResponse.json({ error: "העדכון נכשל" }, { status: 500, headers })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authorization = await requireApiUser("ADMIN")
  if ("response" in authorization) return authorization.response
  const { id } = await params

  const existing = await loadOwnedSchedule(id, authorization.user.id)
  if (!existing) return NextResponse.json({ error: "תזמון לא נמצא" }, { status: 404, headers })

  try {
    await prisma.facebookSchedule.delete({ where: { id } })
    return NextResponse.json({ deleted: true }, { headers })
  } catch {
    console.error("[facebook-schedules] Delete failed")
    return NextResponse.json({ error: "המחיקה נכשלה" }, { status: 500, headers })
  }
}
