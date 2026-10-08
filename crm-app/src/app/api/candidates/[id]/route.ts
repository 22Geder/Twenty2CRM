import { NextRequest, NextResponse } from "next/server"
import { runAfterResponse } from "@/lib/run-after-response"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { sendProcessEntryEmail, sendCandidateStatusChangeEmail } from "@/lib/process-notifications"
import { syncInProcessCandidateToTeamCalendars } from "@/lib/in-process-candidate-calendar"
import { syncCandidateInterviewToTeamCalendars } from "@/lib/candidate-interview-calendar"
import { syncCandidateStatusToTeamCalendars } from "@/lib/candidate-status-calendar"

// GET /api/candidates/[id] - קבלת מועמד ספציפי
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const candidate = await prisma.candidate.findUnique({
      where: { id },
      include: {
        applications: {
          include: {
            position: {
              include: {
                employer: true,
              },
            },
          },
          orderBy: { appliedAt: "desc" },
        },
        interviews: {
          include: {
            position: true,
            scheduler: true,
          },
          orderBy: { scheduledAt: "desc" },
        },
        documents: {
          orderBy: { uploadedAt: "desc" },
        },
        communications: {
          include: {
            user: true,
          },
          orderBy: { createdAt: "desc" },
        },
        tags: true,
        inProcessPosition: {  // 🆕 מביא את פרטי המשרה שהמועמד בתהליך בה
          include: {
            employer: true,
          },
        },
        uploadedBy: { select: { id: true, name: true, email: true } },
        lastViewedBy: { select: { id: true, name: true, email: true } },
      },
    })

    if (!candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      )
    }

    // 🆕 עדכון מעקב צפייה - לא חוסם שגיאה אם נכשל
    try {
      const userId = (session.user as any)?.id
      if (userId) {
        await prisma.candidate.update({
          where: { id },
          data: { lastViewedAt: new Date(), lastViewedById: userId },
        })
      }
    } catch (viewErr) {
      console.error("Failed to update lastViewedAt:", viewErr)
    }

    return NextResponse.json(candidate)
  } catch (error) {
    console.error("Error fetching candidate:", error)
    return NextResponse.json(
      { error: "Failed to fetch candidate" },
      { status: 500 }
    )
  }
}

// PUT /api/candidates/[id] - עדכון מועמד
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const body = await request.json()
    const {
      name,
      email,
      phone,
      alternatePhone,
      resumeUrl,
      linkedinUrl,
      portfolioUrl,
      currentCompany,
      currentTitle,
      yearsOfExperience,
      expectedSalary,
      noticePeriod,
      address,
      city,
      country,
      skills,
      notes,
      rating,
      source,
      hiredAt,
      employmentType,
      employmentStatus,
      employmentEndAt,
      isSelfEmployed,
      resume,  // טקסט קורות חיים מקורי
      hiredToEmployerId,  // 🆕 לאיזה מעסיק התקבל
      inProcessPositionId,  // 🆕 באיזו משרה המועמד בתהליך
      inProcessAt,  // 🆕 מתי נכנס לתהליך
      interviewDate,  // 🆕 תאריך ראיון מתוכנן
      manualSummary,  // 🆕 תקציר ידני של המשתמש
    } = body

    // Check if candidate exists
    const existingCandidate = await prisma.candidate.findUnique({
      where: { id },
    })

    if (!existingCandidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      )
    }

    // If email is being changed, check if it's already taken
    if (email && email !== existingCandidate.email) {
      const emailTaken = await prisma.candidate.findUnique({
        where: { email },
      })

      if (emailTaken) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 409 }
        )
      }
    }

    const candidate = await prisma.candidate.update({
      where: { id },
      data: {
        // 🔧 עדכון רק שדות שנשלחו במפורש
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(alternatePhone !== undefined && { alternatePhone }),
        ...(resumeUrl !== undefined && { resumeUrl }),
        ...(linkedinUrl !== undefined && { linkedinUrl }),
        ...(portfolioUrl !== undefined && { portfolioUrl }),
        ...(currentCompany !== undefined && { currentCompany }),
        ...(currentTitle !== undefined && { currentTitle }),
        ...(yearsOfExperience !== undefined && { yearsOfExperience: yearsOfExperience ? parseInt(yearsOfExperience) : null }),
        ...(expectedSalary !== undefined && { expectedSalary }),
        ...(noticePeriod !== undefined && { noticePeriod }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(country !== undefined && { country }),
        ...(skills !== undefined && { skills }),
        ...(notes !== undefined && { notes }),
        ...(rating !== undefined && { rating: rating ? parseInt(rating) : null }),
        ...(source !== undefined && { source }),
        // 🆕 שדות סטטוס - תומך גם ב-null מפורש
        ...('hiredAt' in body && { hiredAt: hiredAt ? new Date(hiredAt) : null }),
        ...('employmentType' in body && { employmentType: employmentType || null }),
        ...('employmentStatus' in body && { employmentStatus: employmentStatus || null }),
        ...('employmentStatus' in body && employmentStatus === 'IN_PROCESS' && !('inProcessAt' in body) && !existingCandidate.inProcessAt && {
          inProcessAt: new Date(),
        }),
        // 🔄 סנכרון אוטומטי: כשמועמד התקבל/נדחה - מנקה את שדות "בתהליך"
        ...('employmentStatus' in body && (employmentStatus === 'EMPLOYED' || employmentStatus === 'REJECTED') && {
          inProcessPositionId: null,
          inProcessAt: null,
        }),
        ...('employmentEndAt' in body && { employmentEndAt: employmentEndAt ? new Date(employmentEndAt) : null }),
        ...(typeof isSelfEmployed === "boolean" && { isSelfEmployed }),
        ...(resume !== undefined && { resume: resume || null }),
        ...('hiredToEmployerId' in body && { hiredToEmployerId: hiredToEmployerId || null }),
        ...('inProcessPositionId' in body && { inProcessPositionId: inProcessPositionId || null }),
        ...('inProcessAt' in body && { inProcessAt: inProcessAt ? new Date(inProcessAt) : null }),
        ...('interviewDate' in body && { interviewDate: interviewDate ? new Date(interviewDate) : null }),
        ...('interviewDate' in body && interviewDate && { interviewReminderSent: false }),  // איפוס תזכורת כשמעדכנים תאריך
        // 🆕 תקציר ידני - מעדכן גם את timestamp העריכה רק כשהתוכן באמת משתנה
        ...('manualSummary' in body && {
          manualSummary: manualSummary || null,
          manualSummaryUpdatedAt: (manualSummary || null) !== (existingCandidate.manualSummary || null)
            ? new Date()
            : existingCandidate.manualSummaryUpdatedAt,
        }),
      },
      include: {
        applications: {
          include: {
            position: true,
          },
        },
        interviews: true,
      },
    })

    // הסטטוס כבר נשמר. סנכרון הפניות והמייל רצים אחרי התשובה
    // כדי שסימון בסטטוס חודשי/שנתי יתעדכן מיד ולא יחכה ל-SMTP.
    if ('employmentStatus' in body && employmentStatus !== existingCandidate.employmentStatus) {
      const statusContext = {
        candidateId: id,
        candidateName: candidate.name,
        phone: candidate.phone,
        employmentStatus: employmentStatus as string | null,
        previousStatus: existingCandidate.employmentStatus,
        previousPositionId: existingCandidate.inProcessPositionId,
        positionId: (inProcessPositionId as string | undefined) || candidate.inProcessPositionId,
        inProcessAt: candidate.inProcessAt,
        hiredAt: candidate.hiredAt,
        interviewDate: candidate.interviewDate,
        recruiterName: session.user?.name || session.user?.email || null,
      }
      runAfterResponse(() => syncEmploymentStatusSideEffects(statusContext).catch((sideEffectError) => {
        console.error("Employment status side effects failed:", sideEffectError)
      }))
    }

    return NextResponse.json(candidate)
  } catch (error) {
    console.error("Error updating candidate:", error instanceof Error ? error.stack : error)
    return NextResponse.json(
      { error: "Failed to update candidate" },
      { status: 500 }
    )
  }
}

async function syncEmploymentStatusSideEffects(input: {
  candidateId: string
  candidateName: string
  phone: string | null
  employmentStatus: string | null
  previousStatus: string | null
  previousPositionId: string | null
  positionId: string | null
  inProcessAt: Date | null
  hiredAt: Date | null
  interviewDate: Date | null
  recruiterName: string | null
}) {
  const {
    candidateId,
    candidateName,
    phone,
    employmentStatus,
    previousStatus,
    previousPositionId,
    positionId,
    inProcessAt,
    hiredAt,
    interviewDate,
    recruiterName,
  } = input
  const activeStatuses = ['NEW', 'SCREENING', 'INTERVIEW', 'OFFER']

  try {
    if (employmentStatus === 'EMPLOYED') {
      await prisma.application.updateMany({
        where: { candidateId, status: { in: activeStatuses } },
        data: { status: 'HIRED' },
      })
    } else if (employmentStatus === 'REJECTED') {
      await prisma.application.updateMany({
        where: { candidateId, status: { in: activeStatuses } },
        data: { status: 'REJECTED' },
      })
    } else if (employmentStatus === 'IN_PROCESS') {
      const latestNewApp = await prisma.application.findFirst({
        where: { candidateId, status: 'NEW' },
        orderBy: { appliedAt: 'desc' },
      })
      if (latestNewApp) {
        await prisma.application.update({
          where: { id: latestNewApp.id },
          data: { status: 'SCREENING' },
        })
      }
    }

    const emailPositionId = employmentStatus === 'IN_PROCESS'
      ? positionId
      : previousPositionId || positionId
    let positionTitle: string | null = null
    let employerName: string | null = null
    if (emailPositionId) {
      const position = await prisma.position.findUnique({
        where: { id: emailPositionId },
        include: { employer: true },
      })
      positionTitle = position?.title || null
      employerName = position?.employer?.name || null
    }

    if (employmentStatus === 'IN_PROCESS' && inProcessAt) {
      await syncInProcessCandidateToTeamCalendars({
        candidateId,
        candidateName,
        inProcessAt,
        positionTitle,
        employerName,
      })
    } else if (employmentStatus === 'EMPLOYED' || employmentStatus === 'REJECTED') {
      await syncCandidateStatusToTeamCalendars({
        candidateId,
        candidateName,
        status: employmentStatus,
        statusDate: employmentStatus === 'EMPLOYED' && hiredAt ? hiredAt : new Date(),
        positionTitle,
        employerName,
      })
    }
    if (interviewDate) {
      await syncCandidateInterviewToTeamCalendars({
        candidateId,
        candidateName,
        interviewDate,
        positionTitle,
        employerName,
      })
    }

    if (employmentStatus === 'IN_PROCESS' && previousStatus !== 'IN_PROCESS') {
      await sendProcessEntryEmail({
        candidateName,
        positionTitle,
        employerName,
        phone,
        recruiterName,
      })
    } else if (employmentStatus === 'EMPLOYED' || employmentStatus === 'REJECTED') {
      await sendCandidateStatusChangeEmail({
        candidateName,
        phone,
        positionTitle,
        employerName,
        newStatus: employmentStatus,
        oldStatus: previousStatus,
        candidateId,
      })
    } else if (previousStatus === 'IN_PROCESS') {
      await sendCandidateStatusChangeEmail({
        candidateName,
        phone,
        positionTitle,
        employerName,
        newStatus: 'WITHDRAWN',
        oldStatus: 'IN_PROCESS',
        candidateId,
      })
    } else if (employmentStatus) {
      await sendCandidateStatusChangeEmail({
        candidateName,
        phone,
        newStatus: employmentStatus,
        oldStatus: previousStatus,
        candidateId,
      })
    }
  } catch (sideEffectError) {
    console.error("Employment status side effects failed:", sideEffectError)
  }
}

// DELETE /api/candidates/[id] - מחיקת מועמד
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Check if candidate exists
    const candidate = await prisma.candidate.findUnique({
      where: { id },
    })

    if (!candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      )
    }

    if (candidate.isSelfEmployed) {
      return NextResponse.json(
        { error: "Self-employed candidates cannot be deleted" },
        { status: 403 }
      )
    }

    // Delete candidate (cascade will delete related records)
    await prisma.candidate.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Candidate deleted successfully" })
  } catch (error) {
    console.error("Error deleting candidate:", error)
    return NextResponse.json(
      { error: "Failed to delete candidate" },
      { status: 500 }
    )
  }
}
