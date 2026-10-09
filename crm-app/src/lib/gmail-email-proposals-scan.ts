import type { gmail_v1 } from "googleapis"
import { prisma } from "@/lib/prisma"
import { createGmailClient } from "@/lib/gmail-mailboxes"
import {
  EMAIL_ATTACHMENT_MAX_BYTES,
  extractTextFromJobFile,
  fileExtension,
  isAttachmentTooLarge,
  isSupportedJobFile,
} from "@/lib/document-text-extraction"
import { hasResumeKeywords } from "@/lib/resume-keywords"
import { analyzeResumeWithGemini } from "@/lib/gemini-ai"
import { extractInterviewDateWithAi } from "@/lib/email-interview-ai"
import {
  extractEmailAddresses,
  extractLocationHint,
  isPlausibleInterviewDate,
  mentionsInterview,
  parseCandidateFromResumeText,
  parseInterviewDateTime,
  parseSender,
  serializeParsedCandidate,
} from "@/lib/email-proposals"

const CV_LABEL = "Processed-CRM-Candidates"
const INTERVIEW_LABEL = "Processed-CRM-Interviews"
const COOLDOWN_MS = 10 * 60 * 1000
const MAX_CV_MESSAGES = 10
const MAX_INTERVIEW_MESSAGES = 15
const MAX_AI_CALLS = 5
const RESUME_EXTENSIONS = ["pdf", "doc", "docx"]

type GmailClient = ReturnType<typeof createGmailClient>
type Part = gmail_v1.Schema$MessagePart | null | undefined

export type ProposalScanResult = {
  success: boolean
  emailsChecked: number
  candidateProposals: number
  interviewProposals: number
  duplicates: number
  errors: string[]
  statusCode?: number
  error?: string
}

function header(headers: Array<{ name?: string | null; value?: string | null }> | undefined, name: string) {
  return headers?.find((item) => item.name?.toLowerCase() === name.toLowerCase())?.value || ""
}

export function decodeMessageBody(payload: Part): string {
  const chunks: string[] = []
  const visit = (part: Part) => {
    if (part?.body?.data && (part.mimeType === "text/plain" || part.mimeType === "text/html" || !part.mimeType)) {
      chunks.push(Buffer.from(part.body.data, "base64url").toString("utf8"))
    }
    for (const child of part?.parts || []) visit(child)
  }
  visit(payload)
  return chunks.join(" ").replace(/<script[\s\S]*?<\/script>|<iframe[\s\S]*?<\/iframe>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

export type ResumeAttachment = { id: string; filename: string; mimeType: string; size: number }

export function collectResumeAttachments(payload: Part): ResumeAttachment[] {
  const files: ResumeAttachment[] = []
  const visit = (part: Part) => {
    if (part?.filename && part.body?.attachmentId && isSupportedJobFile(part.filename, part.mimeType)
      && RESUME_EXTENSIONS.includes(fileExtension(part.filename))) {
      files.push({
        id: part.body.attachmentId,
        filename: part.filename.slice(0, 250),
        mimeType: part.mimeType || "application/octet-stream",
        size: part.body.size || 0,
      })
    }
    for (const child of part?.parts || []) visit(child)
  }
  visit(payload)
  return files
}

async function ensureLabel(gmail: GmailClient, name: string) {
  const labels = await gmail.users.labels.list({ userId: "me" })
  const existing = labels.data.labels?.find((label) => label.name === name)
  if (existing?.id) return existing.id
  const created = await gmail.users.labels.create({ userId: "me", requestBody: { name } })
  if (!created.data.id) throw new Error("Gmail label was not created")
  return created.data.id
}

async function markProcessed(gmail: GmailClient, messageId: string, labelId: string) {
  await gmail.users.messages.modify({ userId: "me", id: messageId, requestBody: { addLabelIds: [labelId] } })
}

async function scanResumes(gmail: GmailClient, mailboxId: string, mailboxEmail: string, result: ProposalScanResult) {
  const labelId = await ensureLabel(gmail, CV_LABEL)
  const list = await gmail.users.messages.list({
    userId: "me",
    q: `newer_than:30d has:attachment -label:${CV_LABEL}`,
    maxResults: MAX_CV_MESSAGES,
  })

  for (const message of list.data.messages || []) {
    if (!message.id) continue
    result.emailsChecked += 1
    try {
      const full = await gmail.users.messages.get({ userId: "me", id: message.id, format: "full" })
      const headers = full.data.payload?.headers
      const subject = header(headers, "Subject")
      const from = header(headers, "From")
      if (parseSender(from).email === mailboxEmail.toLowerCase()) {
        await markProcessed(gmail, message.id, labelId)
        continue
      }
      const body = decodeMessageBody(full.data.payload)

      for (const attachment of collectResumeAttachments(full.data.payload)) {
        if (!hasResumeKeywords(subject, body, attachment.filename)) continue
        const existingImport = await prisma.gmailCandidateImport.findUnique({
          where: { mailboxId_sourceMessageId_attachmentId: { mailboxId, sourceMessageId: message.id, attachmentId: attachment.id } },
          select: { id: true },
        })
        if (existingImport) continue

        const base = {
          mailboxId,
          sourceMessageId: message.id,
          attachmentId: attachment.id,
          fileName: attachment.filename,
          mimeType: attachment.mimeType,
          sourceSender: from.slice(0, 250),
          sourceSubject: subject.slice(0, 300),
        }
        if (isAttachmentTooLarge(attachment.size, EMAIL_ATTACHMENT_MAX_BYTES)) {
          await prisma.gmailCandidateImport.create({ data: { ...base, status: "FAILED", errorMessage: "הקובץ גדול מ-10MB" } })
          continue
        }

        const file = await gmail.users.messages.attachments.get({ userId: "me", messageId: message.id, id: attachment.id })
        if (!file.data.data) continue
        const buffer = Buffer.from(file.data.data, "base64url")
        if (buffer.length > EMAIL_ATTACHMENT_MAX_BYTES) continue

        const text = await extractTextFromJobFile(buffer, attachment.filename)
        if (text.length < 50) {
          await prisma.gmailCandidateImport.create({
            data: { ...base, status: "FAILED", extractedChars: text.length, errorMessage: "לא ניתן לחלץ טקסט מהקובץ" },
          })
          continue
        }

        const parsed = parseCandidateFromResumeText({ text, from, excludeEmails: [mailboxEmail] })
        if (parsed.email) {
          const existingCandidate = await prisma.candidate.findUnique({ where: { email: parsed.email }, select: { id: true } })
          if (existingCandidate) {
            result.duplicates += 1
            continue
          }
        }
        try {
          const ai = await analyzeResumeWithGemini(text.slice(0, 12000))
          parsed.skills = ai.skills.slice(0, 20)
          parsed.summary = ai.summary || null
          parsed.yearsOfExperience = Number.isFinite(ai.experience) ? Math.round(ai.experience) : null
        } catch {
          // ניתוח AI אופציונלי; ההצעה נשמרת גם בלעדיו
        }

        await prisma.gmailCandidateImport.create({
          data: { ...base, status: "PENDING", parsedCandidate: serializeParsedCandidate(parsed), extractedChars: text.length },
        })
        result.candidateProposals += 1
      }
      await markProcessed(gmail, message.id, labelId)
    } catch {
      result.errors.push(`cv:${message.id.slice(0, 12)}`)
    }
  }
}

async function scanInterviews(gmail: GmailClient, mailboxId: string, mailboxEmail: string, result: ProposalScanResult) {
  const labelId = await ensureLabel(gmail, INTERVIEW_LABEL)
  const list = await gmail.users.messages.list({
    userId: "me",
    q: `newer_than:14d -label:${INTERVIEW_LABEL}`,
    maxResults: MAX_INTERVIEW_MESSAGES,
  })
  let aiCalls = 0
  const now = new Date()

  for (const message of list.data.messages || []) {
    if (!message.id) continue
    result.emailsChecked += 1
    try {
      const full = await gmail.users.messages.get({ userId: "me", id: message.id, format: "full" })
      const headers = full.data.payload?.headers
      const subject = header(headers, "Subject")
      const body = decodeMessageBody(full.data.payload)
      if (!mentionsInterview(subject, body)) {
        await markProcessed(gmail, message.id, labelId)
        continue
      }

      const addresses = extractEmailAddresses(
        `${header(headers, "From")} ${header(headers, "To")} ${header(headers, "Cc")}`,
      ).filter((email) => email !== mailboxEmail.toLowerCase())
      const candidates = addresses.length
        ? await prisma.candidate.findMany({
            where: { email: { in: addresses, mode: "insensitive" } },
            select: { id: true, inProcessPositionId: true },
            take: 2,
          })
        : []
      if (candidates.length !== 1) {
        await markProcessed(gmail, message.id, labelId)
        continue
      }

      const text = `${subject} ${body.slice(0, 2500)}`
      let when = parseInterviewDateTime(text, now)
      if (!isPlausibleInterviewDate(when, now)) {
        when = null
        if (aiCalls < MAX_AI_CALLS) {
          aiCalls += 1
          when = await extractInterviewDateWithAi(text, now).catch(() => null)
        }
      }
      if (when) {
        const created = await prisma.gmailInterviewProposal.createMany({
          data: [{
            mailboxId,
            sourceMessageId: message.id,
            candidateId: candidates[0].id,
            positionId: candidates[0].inProcessPositionId,
            proposedAt: when,
            location: extractLocationHint(body),
            snippet: subject.slice(0, 300),
            sourceSender: header(headers, "From").slice(0, 250),
          }],
          skipDuplicates: true,
        })
        result.interviewProposals += created.count
      }
      await markProcessed(gmail, message.id, labelId)
    } catch {
      result.errors.push(`interview:${message.id.slice(0, 12)}`)
    }
  }
}

export async function scanMailboxForProposals(mailboxId: string): Promise<ProposalScanResult> {
  const startedAt = Date.now()
  const result: ProposalScanResult = {
    success: true, emailsChecked: 0, candidateProposals: 0, interviewProposals: 0, duplicates: 0, errors: [],
  }

  const recent = await prisma.gmailScanLog.findFirst({
    where: { mailboxId, status: { startsWith: "PROPOSALS_" }, createdAt: { gte: new Date(Date.now() - COOLDOWN_MS) } },
    select: { id: true },
  })
  if (recent) return { ...result, success: false, statusCode: 429, error: "Mailbox was scanned recently" }

  const mailbox = await prisma.gmailMailbox.findFirst({ where: { id: mailboxId, active: true } })
  if (!mailbox) return { ...result, success: false, statusCode: 404, error: "Mailbox not found" }

  let status = "PROPOSALS_SUCCESS"
  try {
    const gmail = createGmailClient(mailbox.refreshToken)
    await scanResumes(gmail, mailbox.id, mailbox.email, result)
    await scanInterviews(gmail, mailbox.id, mailbox.email, result)
    if (result.errors.length) status = "PROPOSALS_PARTIAL"
  } catch {
    status = "PROPOSALS_FAILED"
    result.success = false
    result.errors.push("scan_failed")
  }

  await prisma.gmailScanLog.create({
    data: {
      mailboxId,
      emailsChecked: result.emailsChecked,
      proposalsCreated: result.candidateProposals + result.interviewProposals,
      errorCount: result.errors.length,
      durationMs: Date.now() - startedAt,
      status,
    },
  }).catch(() => undefined)
  return result
}
