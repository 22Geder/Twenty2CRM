import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const employers = await prisma.employer.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            positions: true
          }
        }
      }
    })

    return NextResponse.json(employers)
  } catch (error) {
    console.error("Error fetching employers:", error)
    return NextResponse.json(
      { error: "Failed to fetch employers" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, phone, website, logo, description } = body

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      )
    }

    const employer = await prisma.employer.create({
      data: {
        name,
        email,
        phone,
        website,
        logo,
        description
      }
    })

    return NextResponse.json(employer, { status: 201 })
  } catch (error) {
    console.error("Error creating employer:", error)
    return NextResponse.json(
      { error: "Failed to create employer" },
      { status: 500 }
    )
  }
}
