import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireApiUser } from "@/lib/api-authorization"
import { prisma } from "@/lib/prisma"
import { isRateLimited } from "@/lib/facebook-rate-limit"

const headers = { "Cache-Control": "private, no-store" }

const createSchema = z.object({
  name: z.string().trim().min(1).max(100),
  originalContent: z.string().trim().min(1).max(10_000),
  enhancedContent: z.string().trim().max(10_000).optional(),
  mediaUrls: z.array(z.string().url()).max(10).optional(),
})

export async function GET() {
  const authorization = await requireApiUser("ADMIN")
  if ("response" in authorization) return authorization.response

  const templates = await prisma.facebookPostTemplate.findMany({
    where: { createdById: authorization.user.id },
    orderBy: { updatedAt: "desc" },
  })
  return NextResponse.json({
    templates: templates.map((template) => ({ ...template, mediaUrls: template.mediaUrls ? JSON.parse(template.mediaUrls) : [] })),
  }, { headers })
}

export async function POST(request: NextRequest) {
  const authorization = await requireApiUser("ADMIN")
  if ("response" in authorization) return authorization.response

  if (isRateLimited(`facebook-post-templates:${authorization.user.id}`, 30, 60 * 1000)) {
    return NextResponse.json({ error: "יותר מדי בקשות" }, { status: 429, headers })
  }

  try {
    const parsed = createSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400, headers })
    }

    const template = await prisma.facebookPostTemplate.create({
      data: {
        name: parsed.data.name,
        originalContent: parsed.data.originalContent,
        enhancedContent: parsed.data.enhancedContent,
        mediaUrls: parsed.data.mediaUrls ? JSON.stringify(parsed.data.mediaUrls) : null,
        createdById: authorization.user.id,
      },
    })
    return NextResponse.json({ template: { ...template, mediaUrls: parsed.data.mediaUrls ?? [] } }, { status: 201, headers })
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "כבר קיימת תבנית בשם הזה" }, { status: 409, headers })
    }
    console.error("[facebook-post-templates] Create failed")
    return NextResponse.json({ error: "יצירת התבנית נכשלה" }, { status: 500, headers })
  }
}
