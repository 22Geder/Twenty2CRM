import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireApiUser } from "@/lib/api-authorization"
import { prisma } from "@/lib/prisma"
import { enhanceFacebookPostWithGemini } from "@/lib/gemini-ai"
import { isRateLimited } from "@/lib/facebook-rate-limit"

const headers = { "Cache-Control": "private, no-store" }
const toneSchema = z.object({ tone: z.enum(["פורמלי", "קליל", "נמרץ"]).optional() })

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authorization = await requireApiUser("ADMIN")
  if ("response" in authorization) return authorization.response
  const { id } = await params

  if (isRateLimited(`facebook-enhance-ai:${id}`, 10, 60 * 60 * 1000) ||
      isRateLimited("facebook-enhance-ai:global", 30, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "יותר מדי בקשות שדרוג - נסה שוב מאוחר יותר" }, { status: 429, headers })
  }

  const post = await prisma.facebookPost.findFirst({ where: { id, createdById: authorization.user.id } })
  if (!post) return NextResponse.json({ error: "פוסט לא נמצא" }, { status: 404, headers })

  const parsed = toneSchema.safeParse(await request.json().catch(() => ({})))
  const tone = parsed.success ? parsed.data.tone : undefined

  try {
    const { enhancedContent, addedStructure } = await enhanceFacebookPostWithGemini(post.originalContent, tone)

    const updated = await prisma.facebookPost.update({
      where: { id },
      data: { enhancedContent, useEnhanced: addedStructure },
    })

    return NextResponse.json({ enhancedContent: updated.enhancedContent, addedStructure }, { headers })
  } catch {
    console.error("[facebook-posts] enhance-ai failed")
    return NextResponse.json({ error: "שדרוג התוכן נכשל" }, { status: 500, headers })
  }
}
