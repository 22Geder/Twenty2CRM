import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireApiUser } from "@/lib/api-authorization"
import { prisma } from "@/lib/prisma"
import { isPlausibleInterviewDate } from "@/lib/email-proposals"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const requestSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  scheduledAt: z.string().datetime().optional(),
  type: z.enum(["PHONE", "VIDEO", "ONSITE", "TECHNICAL", "HR"]).optional(),
})

// אישור קובע ראיון ב-CRM בלבד. לא נשלחים זימוני יומן ולא מיילים למועמד.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authorization = await requireApiUser()
    if ("response" in authorization) return authorization.response

    const { id } = await params
    const parsed = requestSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: "פרטים לא תקינים" }, { status: 400 })

    const proposal = await prisma.gmailInterviewProposal.findUnique({ where: { id } })
    if (!proposal) return NextResponse.json({ error: "ההצעה לא נמצאה" }, { status: 404 })

    if (parsed.data.action === "REJECT") {
      const rejected = await prisma.gmailInterviewProposal.updateMany({
        where: { id, status: "PENDING" },
        data: { status: "REJECTED", reviewedById: authorization.user.id, reviewedAt: new Date() },
      })
      if (rejected.count !== 1) return NextResponse.json({ error: "ההצעה כבר טופלה" }, { status: 409 })
      return NextResponse.json({ success: true, status: "REJECTED" })
    }

    if (proposal.status !== "PENDING") return NextResponse.json({ error: "ההצעה כבר טופלה" }, { status: 409 })

    const scheduledAt = parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : proposal.proposedAt
    if (!isPlausibleInterviewDate(scheduledAt, new Date())) {
      return NextResponse.json({ error: "תאריך הראיון אינו תקין או רחוק מדי" }, { status: 400 })
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id: proposal.candidateId },
      select: { id: true, name: true, inProcessPositionId: true },
    })
    if (!candidate) return NextResponse.json({ error: "המועמד לא נמצא" }, { status: 404 })

    const positionId = proposal.positionId || candidate.inProcessPositionId
    if (!positionId) return NextResponse.json({ error: "למועמד אין משרה בתהליך. יש לקבוע את הראיון ידנית." }, { status: 409 })

    const application = await prisma.application.findUnique({
      where: { candidateId_positionId: { candidateId: candidate.id, positionId } },
      select: { id: true },
    })
    if (!application) return NextResponse.json({ error: "אין הגשה למועמד למשרה זו. יש לקבוע את הראיון ידנית." }, { status: 409 })

    const interview = await prisma.$transaction(async (tx) => {
      const claim = await tx.gmailInterviewProposal.updateMany({
        where: { id, status: "PENDING" },
        data: { status: "APPROVED", reviewedById: authorization.user.id, reviewedAt: new Date() },
      })
      if (claim.count !== 1) return null

      const created = await tx.interview.create({
        data: {
          title: `ראיון עם ${candidate.name}`,
          type: parsed.data.type || "PHONE",
          scheduledAt,
          duration: 60,
          location: proposal.location,
          notes: "נקבע מהצעה שזוהתה במייל ואושרה ידנית",
          applicationId: application.id,
          positionId,
          candidateId: candidate.id,
          schedulerId: authorization.user.id,
          status: "SCHEDULED",
        },
        select: { id: true },
      })
      await tx.candidate.update({
        where: { id: candidate.id },
        data: { interviewDate: scheduledAt, interviewReminderSent: false },
      })
      await tx.gmailInterviewProposal.update({ where: { id }, data: { interviewId: created.id } })
      return created
    })
    if (!interview) return NextResponse.json({ error: "ההצעה כבר טופלה" }, { status: 409 })

    return NextResponse.json({ success: true, status: "APPROVED", interviewId: interview.id })
  } catch {
    console.error("[email-proposals-interview-review] Error")
    return NextResponse.json({ error: "קביעת הראיון נכשלה" }, { status: 500 })
  }
}
