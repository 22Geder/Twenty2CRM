import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { checkCalendarConflicts } from "@/lib/google-calendar"

// POST /api/calendar/check-conflicts
// Body: { startTime: ISO string, durationMinutes: number }
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { startTime, durationMinutes } = await request.json()

    if (!startTime) {
      return NextResponse.json({ hasConflict: false })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { googleCalendarRefreshToken: true },
    })

    if (!user?.googleCalendarRefreshToken) {
      // Not connected — skip conflict check
      return NextResponse.json({ hasConflict: false, notConnected: true })
    }

    const start = new Date(startTime)
    const end   = new Date(start.getTime() + (durationMinutes || 60) * 60 * 1000)

    const hasConflict = await checkCalendarConflicts(
      user.googleCalendarRefreshToken,
      start,
      end
    )

    return NextResponse.json({ hasConflict })
  } catch (error) {
    console.error("Conflict check error:", error)
    return NextResponse.json({ hasConflict: false })
  }
}
