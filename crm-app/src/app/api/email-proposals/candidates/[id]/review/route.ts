import { NextRequest, NextResponse } from "next/server"
import { mkdir, unlink, writeFile } from "fs/promises"
import { join } from "path"
import { z } from "zod"
import { requireApiUser } from "@/lib/api-authorization"
import { prisma } from "@/lib/prisma"
import { createGmailClient } from "@/lib/gmail-mailboxes"
import { collectResumeAttachments } from "@/lib/gmail-email-proposals-scan"
import { EMAIL_ATTACHMENT_MAX_BYTES, extractTextFromJobFile } from "@/lib/document-text-extraction"
import { deserializeParsedCandidate, normalizeIsraeliPhone, safeResumeFileName } from "@/lib/email-proposals"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const requestSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  name: z.string().trim().min(1).max(120).optional(),
  email: z.string().trim().email().max(200).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional(),
})

// אישור יוצר מועמד ב-CRM בלבד. לא נשלח שום מייל או הודעה למועמד.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let claimedId: string | null = null
  let savedFile: string | null = null
  try {
    const authorization = await requireApiUser()
    if ("response" in authorization) return authorization.response

    const { id } = await params
    const parsed = requestSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: "פרטים לא תקינים" }, { status: 400 })

    const item = await prisma.gmailCandidateImport.findUnique({ where: { id } })
    if (!item) return NextResponse.json({ error: "ההצעה לא נמצאה" }, { status: 404 })

    if (parsed.data.action === "REJECT") {
      const rejected = await prisma.gmailCandidateImport.updateMany({
        where: { id, status: "PENDING" },
        data: { status: "REJECTED", reviewedById: authorization.user.id, reviewedAt: new Date() },
      })
      if (rejected.count !== 1) return NextResponse.json({ error: "ההצעה כבר טופלה" }, { status: 409 })
      return NextResponse.json({ success: true, status: "REJECTED" })
    }

    const stored = deserializeParsedCandidate(item.parsedCandidate)
    const name = parsed.data.name || stored.name
    if (!name) return NextResponse.json({ error: "חובה להזין שם מועמד" }, { status: 400 })
    const email = (parsed.data.email === undefined ? stored.email : parsed.data.email || null)?.toLowerCase() || null
    const phoneInput = parsed.data.phone === undefined ? stored.phone : parsed.data.phone || null
    const phone = phoneInput ? normalizeIsraeliPhone(phoneInput) : null
    if (phoneInput && !phone) return NextResponse.json({ error: "מספר טלפון לא תקין" }, { status: 400 })

    if (email && await prisma.candidate.findUnique({ where: { email }, select: { id: true } })) {
      return NextResponse.json({ error: "כבר קיים מועמד עם כתובת המייל הזו" }, { status: 409 })
    }
    if (phone && await prisma.candidate.findFirst({ where: { phone }, select: { id: true } })) {
      return NextResponse.json({ error: "כבר קיים מועמד עם מספר הטלפון הזה" }, { status: 409 })
    }

    const claim = await prisma.gmailCandidateImport.updateMany({
      where: { id, status: "PENDING" },
      data: { status: "PROCESSING" },
    })
    if (claim.count !== 1) return NextResponse.json({ error: "ההצעה כבר טופלה" }, { status: 409 })
    claimedId = id

    const mailbox = await prisma.gmailMailbox.findFirst({ where: { id: item.mailboxId, active: true } })
    if (!mailbox) throw new Error("mailbox_missing")
    const gmail = createGmailClient(mailbox.refreshToken)
    const message = await gmail.users.messages.get({ userId: "me", id: item.sourceMessageId, format: "full" })
    const attachments = collectResumeAttachments(message.data.payload)
    const attachment = attachments.find((file) => file.id === item.attachmentId)
      || attachments.find((file) => file.filename === item.fileName)
    if (!attachment) throw new Error("attachment_missing")
    const file = await gmail.users.messages.attachments.get({
      userId: "me", messageId: item.sourceMessageId, id: attachment.id,
    })
    if (!file.data.data) throw new Error("attachment_empty")
    const buffer = Buffer.from(file.data.data, "base64url")
    if (buffer.length > EMAIL_ATTACHMENT_MAX_BYTES) throw new Error("attachment_too_large")

    const resumeText = await extractTextFromJobFile(buffer, item.fileName)
    const uploadsDir = join(process.cwd(), "public", "uploads", "resumes")
    await mkdir(uploadsDir, { recursive: true })
    const storedName = `${Date.now()}-${safeResumeFileName(item.fileName)}`
    savedFile = join(uploadsDir, storedName)
    await writeFile(savedFile, buffer)

    const subject = item.sourceSubject || ""
    const candidate = await prisma.candidate.create({
      data: {
        name,
        email,
        phone,
        city: stored.city,
        currentTitle: stored.currentTitle,
        yearsOfExperience: stored.yearsOfExperience,
        skills: stored.skills.length ? stored.skills.join(", ") : null,
        resumeUrl: `/uploads/resumes/${storedName}`,
        resume: resumeText,
        aiProfile: stored.summary ? JSON.stringify({ summary: stored.summary, skills: stored.skills, aiExtracted: true }) : null,
        source: "EMAIL_AUTO",
        notes: `נקלט ממייל באישור ידני${subject ? ` | נושא: ${subject}` : ""}`,
        uploadedById: authorization.user.id,
      },
      select: { id: true },
    })

    await prisma.gmailCandidateImport.update({
      where: { id },
      data: { status: "APPROVED", candidateId: candidate.id, reviewedById: authorization.user.id, reviewedAt: new Date() },
    })
    return NextResponse.json({ success: true, status: "APPROVED", candidateId: candidate.id })
  } catch {
    console.error("[email-proposals-candidate-review] Error")
    if (savedFile) await unlink(savedFile).catch(() => undefined)
    if (claimedId) {
      await prisma.gmailCandidateImport.updateMany({ where: { id: claimedId, status: "PROCESSING" }, data: { status: "PENDING" } })
        .catch(() => undefined)
    }
    return NextResponse.json({ error: "יצירת המועמד נכשלה. ההצעה נשארה ממתינה." }, { status: 500 })
  }
}
