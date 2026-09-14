import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { getCalendarAuthUrl } from "@/lib/google-calendar"

// GET /api/calendar/auth — redirect to Google OAuth for Calendar access
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = getCalendarAuthUrl()
    return NextResponse.redirect(url)
  } catch (error) {
    console.error("Calendar OAuth configuration error:", error)
    return NextResponse.redirect(new URL("/dashboard/calendar-setup?error=oauth_config", request.url))
  }
}
