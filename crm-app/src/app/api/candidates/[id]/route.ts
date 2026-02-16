import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

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
      },
    })

    if (!candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      )
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
        name,
        email,
        phone,
        alternatePhone,
        resumeUrl,
        linkedinUrl,
        portfolioUrl,
        currentCompany,
        currentTitle,
        yearsOfExperience: yearsOfExperience ? parseInt(yearsOfExperience) : null,
        expectedSalary,
        noticePeriod,
        address,
        city,
        country,
        skills,
        notes,
        rating: rating ? parseInt(rating) : null,
        source,
        hiredAt: hiredAt ? new Date(hiredAt) : null,
        employmentType: employmentType || null,
        employmentStatus: employmentStatus || null,
        employmentEndAt: employmentEndAt ? new Date(employmentEndAt) : null,
        isSelfEmployed: typeof isSelfEmployed === "boolean" ? isSelfEmployed : undefined,
        resume: resume || undefined,  // שמירת טקסט קורות חיים
        hiredToEmployerId: hiredToEmployerId || null,  // 🆕 לאיזה מעסיק התקבל
        inProcessPositionId: inProcessPositionId !== undefined ? (inProcessPositionId || null) : undefined,  // 🆕 באיזו משרה בתהליך
        inProcessAt: inProcessAt !== undefined ? (inProcessAt ? new Date(inProcessAt) : null) : undefined,  // 🆕 מתי נכנס לתהליך
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

    return NextResponse.json(candidate)
  } catch (error) {
    console.error("Error updating candidate:", error)
    return NextResponse.json(
      { error: "Failed to update candidate" },
      { status: 500 }
    )
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
