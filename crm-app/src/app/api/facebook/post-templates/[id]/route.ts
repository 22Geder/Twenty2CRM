import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireApiUser } from "@/lib/api-authorization"
import { prisma } from "@/lib/prisma"

const headers = { "Cache-Control": "private, no-store" }

const updateSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  originalContent: z.string().trim().min(1).max(10_000).optional(),
  enhancedContent: z.string().trim().max(10_000).nullable().optional(),
  mediaUrls: z.array(z.string().url()).max(10).optional(),
})

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authorization = await requireApiUser("ADMIN")
  if ("response" in authorization) return authorization.response
  const { id } = await params

  const existing = await prisma.facebookPostTemplate.findUnique({ where: { id }, select: { createdById: true } })
  if (!existing || existing.createdById !== authorization.user.id) {
    return NextResponse.json({ error: "תבנית לא נמצאה" }, { status: 404, headers })
  }

  try {
    const parsed = updateSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400, headers })
    }

    const template = await prisma.facebookPostTemplate.update({
      where: { id },
      data: {
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        ...(parsed.data.originalContent !== undefined ? { originalContent: parsed.data.originalContent } : {}),
        ...(parsed.data.enhancedContent !== undefined ? { enhancedContent: parsed.data.enhancedContent } : {}),
        ...(parsed.data.mediaUrls !== undefined ? { mediaUrls: JSON.stringify(parsed.data.mediaUrls) } : {}),
      },
    })
    return NextResponse.json({ template }, { headers })
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "כבר קיימת תבנית בשם הזה" }, { status: 409, headers })
    }
    console.error("[facebook-post-templates] Update failed")
    return NextResponse.json({ error: "העדכון נכשל" }, { status: 500, headers })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authorization = await requireApiUser("ADMIN")
  if ("response" in authorization) return authorization.response
  const { id } = await params

  const existing = await prisma.facebookPostTemplate.findUnique({ where: { id }, select: { createdById: true } })
  if (!existing || existing.createdById !== authorization.user.id) {
    return NextResponse.json({ error: "תבנית לא נמצאה" }, { status: 404, headers })
  }

  try {
    await prisma.facebookPostTemplate.delete({ where: { id } })
    return NextResponse.json({ deleted: true }, { headers })
  } catch {
    console.error("[facebook-post-templates] Delete failed")
    return NextResponse.json({ error: "המחיקה נכשלה" }, { status: 500, headers })
  }
}
