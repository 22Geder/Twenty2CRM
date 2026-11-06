import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireApiUser } from "@/lib/api-authorization"
import { prisma } from "@/lib/prisma"
import { isRateLimited } from "@/lib/facebook-rate-limit"

const headers = { "Cache-Control": "private, no-store" }

const createSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).optional(),
  groupIds: z.array(z.string().uuid()).min(1),
})

export async function GET() {
  const authorization = await requireApiUser("ADMIN")
  if ("response" in authorization) return authorization.response

  const templates = await prisma.facebookGroupTemplate.findMany({
    where: { createdById: authorization.user.id },
    include: { groups: { select: { id: true, name: true, active: true } } },
    orderBy: { updatedAt: "desc" },
  })
  return NextResponse.json({ templates }, { headers })
}

export async function POST(request: NextRequest) {
  const authorization = await requireApiUser("ADMIN")
  if ("response" in authorization) return authorization.response

  if (isRateLimited(`facebook-group-templates:${authorization.user.id}`, 30, 60 * 1000)) {
    return NextResponse.json({ error: "יותר מדי בקשות" }, { status: 429, headers })
  }

  try {
    const parsed = createSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400, headers })
    }

    const template = await prisma.facebookGroupTemplate.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        createdById: authorization.user.id,
        groups: { connect: parsed.data.groupIds.map((id) => ({ id })) },
      },
      include: { groups: { select: { id: true, name: true } } },
    })
    return NextResponse.json({ template }, { status: 201, headers })
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "כבר קיימת תבנית בשם הזה" }, { status: 409, headers })
    }
    console.error("[facebook-group-templates] Create failed")
    return NextResponse.json({ error: "יצירת התבנית נכשלה" }, { status: 500, headers })
  }
}
