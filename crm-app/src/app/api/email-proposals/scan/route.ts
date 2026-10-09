import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireApiUser } from "@/lib/api-authorization"
import { scanMailboxForProposals } from "@/lib/gmail-email-proposals-scan"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 120

const requestSchema = z.object({ mailboxId: z.string().uuid() })

// סריקה קוראת בלבד: יוצרת הצעות לבדיקה, לא יוצרת מועמדים/ראיונות ולא שולחת מיילים.
export async function POST(request: NextRequest) {
  try {
    const authorization = await requireApiUser()
    if ("response" in authorization) return authorization.response

    const parsed = requestSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: "Invalid mailbox" }, { status: 400 })

    const result = await scanMailboxForProposals(parsed.data.mailboxId)
    return NextResponse.json(result, { status: result.statusCode || (result.success ? 200 : 500) })
  } catch {
    console.error("[email-proposals-scan] Error")
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
