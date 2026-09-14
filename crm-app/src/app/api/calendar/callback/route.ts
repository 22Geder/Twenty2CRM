import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { exchangeCodeForTokens, getCalendarAppOrigin } from "@/lib/google-calendar"
import { prisma } from "@/lib/prisma"

function calendarSetupUrl(request: NextRequest, query: string): URL {
  const forwardedHost = request.headers.get("x-forwarded-host")
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https"
  const publicOrigin = getCalendarAppOrigin() ||
    (forwardedHost ? `${forwardedProto}://${forwardedHost}` : request.nextUrl.origin)
  return new URL(`/dashboard/calendar-setup?${query}`, publicOrigin)
}

// GET /api/calendar/callback?code=... — OAuth2 callback from Google
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.redirect(
        calendarSetupUrl(request, "error=unauthorized")
      )
    }

    const code = request.nextUrl.searchParams.get("code")
    if (!code) {
      return NextResponse.redirect(
        calendarSetupUrl(request, "error=no_code")
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
      calendarSetupUrl(request, "success=1")
    )
  } catch (error) {
    console.error("Calendar OAuth callback error:", error)
    return NextResponse.redirect(
      calendarSetupUrl(request, "error=oauth_failed")
    )
  }
}
