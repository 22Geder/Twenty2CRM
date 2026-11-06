import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireApiUser } from "@/lib/api-authorization"
import { prisma } from "@/lib/prisma"
import { isRateLimited } from "@/lib/facebook-rate-limit"

const headers = { "Cache-Control": "private, no-store" }

const createSchema = z.object({
  label: z.string().trim().max(150).optional(),
  originalContent: z.string().trim().min(1).max(10_000),
  mediaUrls: z.array(z.string().url()).max(10).optional(),
  sourceTemplateId: z.string().uuid().optional(),
})

function serialize(post: { mediaUrls: string | null; [key: string]: unknown }) {
  return { ...post, mediaUrls: post.mediaUrls ? JSON.parse(post.mediaUrls) : [] }
}

export async function GET(request: NextRequest) {
  const authorization = await requireApiUser("ADMIN")
  if ("response" in authorization) return authorization.response

  const status = request.nextUrl.searchParams.get("status") || undefined

  const posts = await prisma.facebookPost.findMany({
    where: { createdById: authorization.user.id, ...(status ? { status } : {}) },
    orderBy: { updatedAt: "desc" },
    take: 100,
  })
  return NextResponse.json({ posts: posts.map(serialize) }, { headers })
}

export async function POST(request: NextRequest) {
  const authorization = await requireApiUser("ADMIN")
  if ("response" in authorization) return authorization.response

  if (isRateLimited(`facebook-posts:${authorization.user.id}`, 30, 60 * 1000)) {
    return NextResponse.json({ error: "יותר מדי בקשות" }, { status: 429, headers })
  }

  try {
    const parsed = createSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400, headers })
    }

    const post = await prisma.facebookPost.create({
      data: {
        label: parsed.data.label,
        originalContent: parsed.data.originalContent,
        mediaUrls: parsed.data.mediaUrls ? JSON.stringify(parsed.data.mediaUrls) : null,
        sourceTemplateId: parsed.data.sourceTemplateId,
        status: "DRAFT",
        createdById: authorization.user.id,
      },
    })
    return NextResponse.json({ post: serialize(post) }, { status: 201, headers })
  } catch {
    console.error("[facebook-posts] Create failed")
    return NextResponse.json({ error: "יצירת הפוסט נכשלה" }, { status: 500, headers })
  }
}
