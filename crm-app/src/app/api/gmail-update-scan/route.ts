import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import type { gmail_v1 } from "googleapis"
import { requireApiUser } from "@/lib/api-authorization"
import { createGmailClient } from "@/lib/gmail-mailboxes"
import { prisma } from "@/lib/prisma"

const requestSchema = z.object({ mailboxId: z.string().uuid() })
const emailPattern = /[\w.-]+@[\w.-]+\.\w+/g
const rejectedPattern = /\b(?:rejected|declined|not\s+(?:accepted|selected|suitable))\b|(?:לא\s+(?:התקבל|התקבלה|מתאים|מתאימה)|נדחה|נדחתה)/i
const employedPattern = /\b(?:accepted|hired|selected)\b|(?:התקבל|התקבלה|קיבלנו\s+לעבודה)/i

function header(headers: Array<{ name?: string | null; value?: string | null }> | undefined, name: string) {
  return headers?.find((item) => item.name?.toLowerCase() === name.toLowerCase())?.value || ""
}

function decodeBody(payload: gmail_v1.Schema$MessagePart | null | undefined): string {
  const chunks: string[] = []
  const visit = (part: gmail_v1.Schema$MessagePart | null | undefined) => {
    if (part?.body?.data && (part.mimeType === "text/plain" || part.mimeType === "text/html" || !part.mimeType)) {
      chunks.push(Buffer.from(part.body.data, "base64url").toString("utf8"))
    }
    for (const child of part?.parts || []) visit(child)
  }
  visit(payload)
  return chunks.join(" ").replace(/<script[\s\S]*?<\/script>|<iframe[\s\S]*?<\/iframe>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

function proposedStatus(text: string): "EMPLOYED" | "REJECTED" | null {
  if (rejectedPattern.test(text)) return "REJECTED"
  if (employedPattern.test(text)) return "EMPLOYED"
  return null
}

async function processedLabelId(gmail: ReturnType<typeof createGmailClient>) {
  const labels = await gmail.users.labels.list({ userId: "me" })
  const existing = labels.data.labels?.find((label) => label.name === "Processed-CRM")
  if (existing?.id) return existing.id
  const created = await gmail.users.labels.create({ userId: "me", requestBody: { name: "Processed-CRM" } })
  if (!created.data.id) throw new Error("Processed label was not created")
  return created.data.id
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now()
  let mailboxId: string | null = null
  let emailsChecked = 0
  let proposalsCreated = 0
  const errors: string[] = []

  try {
    const authorization = await requireApiUser()
    if ("response" in authorization) return authorization.response
    const parsed = requestSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: "Invalid mailbox" }, { status: 400 })
    mailboxId = parsed.data.mailboxId

    const cutoff = new Date(Date.now() - 10 * 60 * 1000)
    const claimed = await prisma.gmailMailbox.updateMany({
      where: { id: mailboxId, active: true, OR: [{ lastScannedAt: null }, { lastScannedAt: { lte: cutoff } }] },
      data: { lastScannedAt: new Date() },
    })
    if (claimed.count !== 1) return NextResponse.json({ error: "Mailbox was scanned recently" }, { status: 429 })

    const mailbox = await prisma.gmailMailbox.findUnique({ where: { id: mailboxId } })
    if (!mailbox) return NextResponse.json({ error: "Mailbox not found" }, { status: 404 })
    const gmail = createGmailClient(mailbox.refreshToken)
    const labelId = await processedLabelId(gmail)
    const list = await gmail.users.messages.list({
      userId: "me",
      q: "newer_than:90d -label:Processed-CRM",
      maxResults: 10,
    })
    const messages = list.data.messages || []
    emailsChecked = messages.length

    for (const message of messages) {
      if (!message.id) continue
      try {
        const metadata = await gmail.users.messages.get({
          userId: "me",
          id: message.id,
          format: "metadata",
          metadataHeaders: ["Subject", "From"],
        })
        const subject = header(metadata.data.payload?.headers, "Subject")
        const subjectStatus = proposedStatus(subject)
        if (!subjectStatus) continue

        const full = await gmail.users.messages.get({ userId: "me", id: message.id, format: "full" })
        const body = decodeBody(full.data.payload)
        const status = proposedStatus(`${subject} ${body}`)
        const sender = header(full.data.payload?.headers, "From").slice(0, 250)
        const addresses = Array.from(new Set((body.match(emailPattern) || []).map((email) => email.toLowerCase())))
          .filter((email) => email !== mailbox.email.toLowerCase())
          .slice(0, 10)
        const candidates = addresses.length
          ? await prisma.candidate.findMany({
              where: { email: { in: addresses, mode: "insensitive" } },
              select: {
                id: true,
                name: true,
                uploadedById: true,
                inProcessPositionId: true,
                inProcessPosition: { select: { recruiterId: true } },
              },
              take: 2,
            })
          : []

        if (status && candidates.length === 1) {
          const candidate = candidates[0]
          const created = await prisma.candidateUpdate.createMany({
            data: [{
              type: "EMAIL_STATUS_PROPOSAL",
              source: "EMAIL",
              title: subject.slice(0, 300) || `עדכון עבור ${candidate.name}`,
              summary: `זוהתה הצעת סטטוס ${status === "EMPLOYED" ? "התקבל" : "נדחה"}`,
              proposedStatus: status,
              sourceMessageId: message.id,
              sourceSender: sender,
              candidateId: candidate.id,
              positionId: candidate.inProcessPositionId,
              uploaderId: candidate.uploadedById,
              recruiterId: candidate.inProcessPosition?.recruiterId || null,
              mailboxId: mailbox.id,
            }],
            skipDuplicates: true,
          })
          proposalsCreated += created.count
        }

        await gmail.users.messages.modify({ userId: "me", id: message.id, requestBody: { addLabelIds: [labelId] } })
      } catch {
        errors.push(`message:${message.id.slice(0, 12)}`)
      }
    }

    await prisma.gmailScanLog.create({
      data: {
        mailboxId,
        emailsChecked,
        proposalsCreated,
        errorCount: errors.length,
        durationMs: Date.now() - startedAt,
        status: errors.length ? "PARTIAL" : "SUCCESS",
      },
    })
    return NextResponse.json({ success: true, emailsChecked, candidatesCreated: 0, proposalsCreated, errors })
  } catch (error) {
    console.error("Gmail update scan failed:", error)
    if (mailboxId) {
      await prisma.gmailScanLog.create({
        data: { mailboxId, emailsChecked, proposalsCreated, errorCount: errors.length + 1, durationMs: Date.now() - startedAt, status: "FAILED" },
      }).catch(() => undefined)
    }
    return NextResponse.json({ success: false, emailsChecked, candidatesCreated: 0, proposalsCreated, errors: [...errors, "scan_failed"] }, { status: 500 })
  }
}