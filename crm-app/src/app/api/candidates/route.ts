import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

// GET /api/candidates - קבלת כל המועמדים
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { phone: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}

    const [candidates, total] = await Promise.all([
      prisma.candidate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          applications: {
            include: {
              position: true,
            },
          },
          tags: true,  // הוסף תגיות למועמדים
          _count: {
            select: {
              applications: true,
              interviews: true,
            },
          },
        },
      }),
      prisma.candidate.count({ where }),
    ])

    return NextResponse.json({
      candidates,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching candidates:", error)
    return NextResponse.json(
      { error: "Failed to fetch candidates" },
      { status: 500 }
    )
  }
}

// POST /api/candidates - יצירת מועמד חדש
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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
    } = body

    // Validation
    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }

    // Check if candidate with this email already exists
    if (email) {
      const existingCandidate = await prisma.candidate.findUnique({
        where: { email },
      })

      if (existingCandidate) {
        return NextResponse.json(
          { error: "Candidate with this email already exists" },
          { status: 409 }
        )
      }
    }

    const candidate = await prisma.candidate.create({
      data: {
        name,
        email: email || null,
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
      },
    })

    return NextResponse.json(candidate, { status: 201 })
  } catch (error) {
    console.error("Error creating candidate:", error)
    return NextResponse.json(
      { error: "Failed to create candidate" },
      { status: 500 }
    )
  }
}
