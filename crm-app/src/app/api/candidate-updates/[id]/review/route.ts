import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireApiUser } from "@/lib/api-authorization"
import { prisma } from "@/lib/prisma"
import { addHiredCandidateToTeamCalendars } from "@/lib/hired-candidate-calendar"
import { sendCandidateStatusChangeEmail } from "@/lib/process-notifications"

const reviewSchema = z.object({ action: z.enum(["APPROVE", "REJECT"]) })
const allowedStatuses = new Set(["EMPLOYED", "REJECTED"])

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authorization = await requireApiUser()
    if ("response" in authorization) return authorization.response

    const parsed = reviewSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: "Invalid review action" }, { status: 400 })
    const { id } = await params

    const result = await prisma.$transaction(async (transaction) => {
      const update = await transaction.candidateUpdate.findUnique({
        where: { id },
        include: {
          candidate: true,
          position: { include: { employer: true } },
        },
      })
      if (!update) return { outcome: "NOT_FOUND" as const }
      if (update.status !== "PENDING") return { outcome: "ALREADY_REVIEWED" as const }

      if (parsed.data.action === "REJECT") {
        const decided = await transaction.candidateUpdate.updateMany({
          where: { id, status: "PENDING" },
          data: { status: "REJECTED", reviewedById: authorization.user.id, reviewedAt: new Date() },
        })
        return { outcome: decided.count === 1 ? "REJECTED" as const : "ALREADY_REVIEWED" as const }
      }

      if (!update.candidateId || !update.candidate || !update.proposedStatus || !allowedStatuses.has(update.proposedStatus)) {
        return { outcome: "INVALID_PROPOSAL" as const }
      }

      const decided = await transaction.candidateUpdate.updateMany({
        where: { id, status: "PENDING" },
        data: { status: "APPROVED", reviewedById: authorization.user.id, reviewedAt: new Date() },
      })
      if (decided.count !== 1) return { outcome: "ALREADY_REVIEWED" as const }

      const isEmployed = update.proposedStatus === "EMPLOYED"
      const candidate = await transaction.candidate.update({
        where: { id: update.candidateId },
        data: {
          employmentStatus: update.proposedStatus,
          hiredAt: isEmployed ? (update.candidate.hiredAt || new Date()) : null,
          ...(!isEmployed && { hiredToEmployerId: null }),
          inProcessPositionId: null,
          inProcessAt: null,
        },
      })
      await transaction.application.updateMany({
        where: {
          candidateId: update.candidateId,
          status: { in: ["NEW", "SCREENING", "PHONE_INTERVIEW", "ONSITE_INTERVIEW", "INTERVIEW", "OFFER"] },
        },
        data: { status: isEmployed ? "HIRED" : "REJECTED" },
      })

      return {
        outcome: "APPROVED" as const,
        candidate,
        oldStatus: update.candidate.employmentStatus,
        positionTitle: update.position?.title || null,
        employerName: update.position?.employer.name || null,
      }
    })

    if (result.outcome === "NOT_FOUND") return NextResponse.json({ error: "Update not found" }, { status: 404 })
    if (result.outcome === "ALREADY_REVIEWED") return NextResponse.json({ error: "Update was already reviewed" }, { status: 409 })
    if (result.outcome === "INVALID_PROPOSAL") return NextResponse.json({ error: "Proposal cannot be applied" }, { status: 422 })

    if (result.outcome === "APPROVED") {
      try {
        await sendCandidateStatusChangeEmail({
          candidateName: result.candidate.name,
          phone: result.candidate.phone,
          positionTitle: result.positionTitle,
          employerName: result.employerName,
          newStatus: result.candidate.employmentStatus || "",
          oldStatus: result.oldStatus,
          candidateId: result.candidate.id,
        })
        if (result.candidate.employmentStatus === "EMPLOYED") {
          await addHiredCandidateToTeamCalendars({
            candidateId: result.candidate.id,
            candidateName: result.candidate.name,
            hiredAt: result.candidate.hiredAt || new Date(),
            positionTitle: result.positionTitle,
            employerName: result.employerName,
          })
        }
      } catch (sideEffectError) {
        console.error("Approved update side effect failed:", sideEffectError)
      }
    }

    return NextResponse.json({ success: true, status: result.outcome })
  } catch (error) {
    console.error("Candidate update review failed:", error)
    return NextResponse.json({ error: "Failed to review update" }, { status: 500 })
  }
}