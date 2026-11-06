import { NextRequest, NextResponse } from "next/server"
import { requireApiUser } from "@/lib/api-authorization"
import { prisma } from "@/lib/prisma"

const headers = { "Cache-Control": "private, no-store" }

export async function GET(request: NextRequest) {
  const authorization = await requireApiUser("ADMIN")
  if ("response" in authorization) return authorization.response

  const postId = request.nextUrl.searchParams.get("postId") || undefined
  const status = request.nextUrl.searchParams.get("status") || undefined

  const logs = await prisma.facebookPublishLog.findMany({
    where: {
      post: { createdById: authorization.user.id },
      ...(postId ? { postId } : {}),
      ...(status ? { status } : {}),
    },
    include: {
      post: { select: { id: true, label: true } },
      group: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  })
  return NextResponse.json({ logs }, { headers })
}
