import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params

    const employer = await prisma.employer.findUnique({
      where: { id },
      include: {
        positions: {
          orderBy: { createdAt: 'desc' },
          include: {
            applications: {
              orderBy: { appliedAt: 'desc' },
              include: {
                candidate: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    city: true,
                    currentTitle: true,
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!employer) {
      return NextResponse.json({ error: "Employer not found" }, { status: 404 })
    }

    return NextResponse.json(employer)
  } catch (error) {
    console.error("Error fetching employer:", error)
    return NextResponse.json(
      { error: "Failed to fetch employer" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params
    const body = await request.json()
    const { name, email, phone, website, logo, description } = body

    const employer = await prisma.employer.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        website,
        logo,
        description
      }
    })

    return NextResponse.json(employer)
  } catch (error) {
    console.error("Error updating employer:", error)
    return NextResponse.json(
      { error: "Failed to update employer" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params

    // Check if employer has positions
    const employer = await prisma.employer.findUnique({
      where: { id },
      include: {
        _count: {
          select: { positions: true }
        }
      }
    })

    if (!employer) {
      return NextResponse.json({ error: "Employer not found" }, { status: 404 })
    }

    if (employer._count.positions > 0) {
      return NextResponse.json(
        { error: "Cannot delete employer with existing positions" },
        { status: 400 }
      )
    }

    await prisma.employer.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting employer:", error)
    return NextResponse.json(
      { error: "Failed to delete employer" },
      { status: 500 }
    )
  }
}
