import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

// GET /api/calendar/status — is the current user connected to Google Calendar?
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        googleCalendarRefreshToken: true,
        googleCalendarEmail: true,
      },
    })

    return NextResponse.json({
      connected: Boolean(user?.googleCalendarRefreshToken),
      calendarEmail: user?.googleCalendarEmail ?? null,
    })
  } catch (error) {
    console.error("Calendar status error:", error)
    return NextResponse.json({ error: "Failed to check status" }, { status: 500 })
  }
}
