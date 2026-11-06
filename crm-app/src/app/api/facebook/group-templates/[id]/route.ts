import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireApiUser } from "@/lib/api-authorization"
import { prisma } from "@/lib/prisma"

const headers = { "Cache-Control": "private, no-store" }

const updateSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  groupIds: z.array(z.string().uuid()).min(1).optional(),
})

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authorization = await requireApiUser("ADMIN")
  if ("response" in authorization) return authorization.response
  const { id } = await params

  try {
    const existing = await prisma.facebookGroupTemplate.findUnique({ where: { id }, select: { createdById: true } })
    if (!existing || existing.createdById !== authorization.user.id) {
      return NextResponse.json({ error: "תבנית לא נמצאה" }, { status: 404, headers })
    }

    const parsed = updateSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400, headers })
    }

    const template = await prisma.facebookGroupTemplate.update({
      where: { id },
      data: {
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
        ...(parsed.data.groupIds ? { groups: { set: parsed.data.groupIds.map((groupId) => ({ id: groupId })) } } : {}),
      },
      include: { groups: { select: { id: true, name: true } } },
    })
    return NextResponse.json({ template }, { headers })
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "כבר קיימת תבנית בשם הזה" }, { status: 409, headers })
    }
    console.error("[facebook-group-templates] Update failed")
    return NextResponse.json({ error: "העדכון נכשל" }, { status: 500, headers })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authorization = await requireApiUser("ADMIN")
  if ("response" in authorization) return authorization.response
  const { id } = await params

  try {
    const existing = await prisma.facebookGroupTemplate.findUnique({ where: { id }, select: { createdById: true } })
    if (!existing || existing.createdById !== authorization.user.id) {
      return NextResponse.json({ error: "תבנית לא נמצאה" }, { status: 404, headers })
    }
    await prisma.facebookGroupTemplate.delete({ where: { id } })
    return NextResponse.json({ deleted: true }, { headers })
  } catch {
    console.error("[facebook-group-templates] Delete failed")
    return NextResponse.json({ error: "המחיקה נכשלה" }, { status: 500, headers })
  }
}
