import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireApiUser } from "@/lib/api-authorization"
import { prisma } from "@/lib/prisma"

const headers = { "Cache-Control": "private, no-store" }

const updateSchema = z.object({
  label: z.string().trim().max(150).nullable().optional(),
  originalContent: z.string().trim().min(1).max(10_000).optional(),
  useEnhanced: z.boolean().optional(),
  mediaUrls: z.array(z.string().url()).max(10).optional(),
})

function serialize(post: { mediaUrls: string | null; [key: string]: unknown }) {
  return { ...post, mediaUrls: post.mediaUrls ? JSON.parse(post.mediaUrls) : [] }
}

async function loadOwnedPost(id: string, userId: string) {
  return prisma.facebookPost.findFirst({
    where: { id, createdById: userId },
    include: { schedules: { where: { active: true }, select: { id: true } } },
  })
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authorization = await requireApiUser("ADMIN")
  if ("response" in authorization) return authorization.response
  const { id } = await params

  const post = await loadOwnedPost(id, authorization.user.id)
  if (!post) return NextResponse.json({ error: "פוסט לא נמצא" }, { status: 404, headers })
  return NextResponse.json({ post: serialize(post) }, { headers })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authorization = await requireApiUser("ADMIN")
  if ("response" in authorization) return authorization.response
  const { id } = await params

  const post = await loadOwnedPost(id, authorization.user.id)
  if (!post) return NextResponse.json({ error: "פוסט לא נמצא" }, { status: 404, headers })
  if (post.status !== "DRAFT" || post.schedules.length > 0) {
    return NextResponse.json({ error: "לא ניתן לערוך פוסט שאינו טיוטה או שמשויך לתזמון פעיל" }, { status: 409, headers })
  }

  try {
    const parsed = updateSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400, headers })
    }

    const updated = await prisma.facebookPost.update({
      where: { id },
      data: {
        ...(parsed.data.label !== undefined ? { label: parsed.data.label } : {}),
        ...(parsed.data.originalContent !== undefined ? { originalContent: parsed.data.originalContent } : {}),
        ...(parsed.data.useEnhanced !== undefined ? { useEnhanced: parsed.data.useEnhanced } : {}),
        ...(parsed.data.mediaUrls !== undefined ? { mediaUrls: JSON.stringify(parsed.data.mediaUrls) } : {}),
      },
    })
    return NextResponse.json({ post: serialize(updated) }, { headers })
  } catch {
    console.error("[facebook-posts] Update failed")
    return NextResponse.json({ error: "העדכון נכשל" }, { status: 500, headers })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authorization = await requireApiUser("ADMIN")
  if ("response" in authorization) return authorization.response
  const { id } = await params

  const post = await loadOwnedPost(id, authorization.user.id)
  if (!post) return NextResponse.json({ error: "פוסט לא נמצא" }, { status: 404, headers })
  if (post.status !== "DRAFT" || post.schedules.length > 0) {
    return NextResponse.json({ error: "לא ניתן למחוק פוסט שאינו טיוטה או שמשויך לתזמון פעיל" }, { status: 409, headers })
  }

  try {
    await prisma.facebookPost.delete({ where: { id } })
    return NextResponse.json({ deleted: true }, { headers })
  } catch {
    console.error("[facebook-posts] Delete failed")
    return NextResponse.json({ error: "המחיקה נכשלה" }, { status: 500, headers })
  }
}
