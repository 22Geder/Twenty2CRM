import { NextRequest, NextResponse } from "next/server"
import { requireApiUser } from "@/lib/api-authorization"
import { prisma } from "@/lib/prisma"
import { isRateLimited } from "@/lib/facebook-rate-limit"

const headers = { "Cache-Control": "private, no-store" }

export async function GET(request: NextRequest) {
  const authorization = await requireApiUser("ADMIN")
  if ("response" in authorization) return authorization.response

  if (isRateLimited(`facebook-groups-list:${authorization.user.id}`, 60, 60 * 1000)) {
    return NextResponse.json({ error: "יותר מדי בקשות" }, { status: 429, headers })
  }

  const search = request.nextUrl.searchParams.get("search")?.trim() || ""
  const activeOnly = request.nextUrl.searchParams.get("activeOnly") !== "false"

  try {
    const groups = await prisma.facebookGroup.findMany({
      where: {
        ...(activeOnly ? { active: true } : {}),
        ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
      },
      select: { id: true, facebookGroupId: true, name: true, url: true, memberCount: true, active: true, lastSyncedAt: true },
      orderBy: { name: "asc" },
    })
    return NextResponse.json({ groups }, { headers })
  } catch {
    console.error("[facebook-groups] Failed to list groups")
    return NextResponse.json({ error: "שגיאה בטעינת הקבוצות" }, { status: 500, headers })
  }
}
