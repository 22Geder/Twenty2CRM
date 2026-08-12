import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

// DELETE /api/calendar/disconnect — remove Calendar tokens from current user
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        googleCalendarRefreshToken: null,
        googleCalendarEmail: null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Calendar disconnect error:", error)
    return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 })
  }
}
