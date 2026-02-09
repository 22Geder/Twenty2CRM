import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

// GET /api/candidates/hired - מועמדים שגוייסו (ברירת מחדל: שנתיים אחורה)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const rangeYears = parseInt(searchParams.get("rangeYears") || "2")
    const includeUnhired = searchParams.get("includeUnhired") === "1"
    const search = searchParams.get("search") || ""

    const fromDate = new Date()
    fromDate.setFullYear(fromDate.getFullYear() - rangeYears)

    const where: any = {
      AND: [
        search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" as const } },
                { email: { contains: search, mode: "insensitive" as const } },
                { phone: { contains: search, mode: "insensitive" as const } },
              ],
            }
          : {},
        includeUnhired
          ? {
              OR: [
                { hiredAt: { gte: fromDate } },
                { hiredAt: null },
              ],
            }
          : {
              hiredAt: { gte: fromDate },
            },
      ],
    }

    const candidates = await prisma.candidate.findMany({
      where,
      orderBy: [{ hiredAt: "desc" }, { createdAt: "desc" }],
      include: {
        tags: true,
        _count: {
          select: { applications: true, interviews: true },
        },
      },
    })

    return NextResponse.json({ candidates })
  } catch (error) {
    console.error("Error fetching hired candidates:", error)
    return NextResponse.json(
      { error: "Failed to fetch hired candidates" },
      { status: 500 }
    )
  }
}
