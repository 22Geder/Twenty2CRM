import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { exchangeCodeForTokens } from "@/lib/google-calendar"
import { prisma } from "@/lib/prisma"

// GET /api/calendar/callback?code=... — OAuth2 callback from Google
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.redirect(
        new URL("/dashboard/calendar-setup?error=unauthorized", request.url)
      )
    }

    const code = request.nextUrl.searchParams.get("code")
    if (!code) {
      return NextResponse.redirect(
        new URL("/dashboard/calendar-setup?error=no_code", request.url)
      )
    }

    const { refreshToken, email } = await exchangeCodeForTokens(code)

    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        googleCalendarRefreshToken: refreshToken,
        googleCalendarEmail: email,
      },
    })

    return NextResponse.redirect(
      new URL("/dashboard/calendar-setup?success=1", request.url)
    )
  } catch (error) {
    console.error("Calendar OAuth callback error:", error)
    return NextResponse.redirect(
      new URL("/dashboard/calendar-setup?error=oauth_failed", request.url)
    )
  }
}
