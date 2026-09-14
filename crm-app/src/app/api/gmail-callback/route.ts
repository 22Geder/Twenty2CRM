import { NextRequest, NextResponse } from "next/server"
import { requireApiUser } from "@/lib/api-authorization"
import { encryptGmailToken, exchangeGmailCode, verifyGmailState } from "@/lib/gmail-mailboxes"
import { prisma } from "@/lib/prisma"

function setupUrl(request: NextRequest, result: "success" | "error") {
  const configured = process.env.NEXTAUTH_URL
  const origin = configured ? new URL(configured).origin : request.nextUrl.origin
  return new URL(`/dashboard/gmail-setup?${result}=1`, origin)
}

export async function GET(request: NextRequest) {
  try {
    const authorization = await requireApiUser("ADMIN")
    if ("response" in authorization) return authorization.response

    const code = request.nextUrl.searchParams.get("code")
    const state = request.nextUrl.searchParams.get("state")
    if (!code || !state || !verifyGmailState(state, authorization.user.id)) {
      return NextResponse.redirect(setupUrl(request, "error"))
    }

    const account = await exchangeGmailCode(code)
    await prisma.gmailMailbox.upsert({
      where: { email: account.email },
      update: {
        refreshToken: encryptGmailToken(account.refreshToken),
        active: true,
        connectedById: authorization.user.id,
      },
      create: {
        email: account.email,
        refreshToken: encryptGmailToken(account.refreshToken),
        connectedById: authorization.user.id,
      },
    })

    return NextResponse.redirect(setupUrl(request, "success"))
  } catch {
    console.error("Gmail OAuth callback failed")
    return NextResponse.redirect(setupUrl(request, "error"))
  }
}
