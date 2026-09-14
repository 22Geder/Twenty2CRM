import { NextResponse } from "next/server"
import { requireApiUser } from "@/lib/api-authorization"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const authorization = await requireApiUser()
  if ("response" in authorization) return authorization.response

  const mailboxes = await prisma.gmailMailbox.findMany({
    where: { active: true },
    select: { id: true, email: true, lastScannedAt: true, createdAt: true },
    orderBy: { email: "asc" },
  })
  return NextResponse.json({ mailboxes }, { headers: { "Cache-Control": "private, no-store" } })
}