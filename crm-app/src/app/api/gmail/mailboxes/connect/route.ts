import { NextResponse } from "next/server"
import { requireApiUser } from "@/lib/api-authorization"
import { createGmailConnectUrl } from "@/lib/gmail-mailboxes"

export async function GET() {
  try {
    const authorization = await requireApiUser("ADMIN")
    if ("response" in authorization) return authorization.response
    return NextResponse.redirect(createGmailConnectUrl(authorization.user.id))
  } catch {
    console.error("Gmail mailbox connection failed")
    return NextResponse.json({ error: "Gmail connection is unavailable" }, { status: 500 })
  }
}