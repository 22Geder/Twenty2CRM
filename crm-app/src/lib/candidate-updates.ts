import { prisma } from "@/lib/prisma"

type CandidateUpdateInput = {
  type: "CV_UPLOADED" | "STATUS_CHANGED" | "EMAIL_STATUS_PROPOSAL"
  source: "CRM" | "EMAIL"
  title: string
  summary?: string | null
  candidateId?: string | null
  positionId?: string | null
  uploaderId?: string | null
  recruiterId?: string | null
  proposedStatus?: "EMPLOYED" | "REJECTED" | null
  mailboxId?: string | null
  sourceMessageId?: string | null
  sourceSender?: string | null
  resolved?: boolean
}

export async function createCandidateUpdate(input: CandidateUpdateInput): Promise<void> {
  try {
    await prisma.candidateUpdate.create({
      data: {
        type: input.type,
        source: input.source,
        status: input.resolved ? "APPROVED" : "PENDING",
        title: input.title,
        summary: input.summary || null,
        candidateId: input.candidateId || null,
        positionId: input.positionId || null,
        uploaderId: input.uploaderId || null,
        recruiterId: input.recruiterId || null,
        proposedStatus: input.proposedStatus || null,
        mailboxId: input.mailboxId || null,
        sourceMessageId: input.sourceMessageId || null,
        sourceSender: input.sourceSender || null,
        reviewedAt: input.resolved ? new Date() : null,
      },
    })
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") return
    console.error("Failed to create candidate update:", error)
  }
}