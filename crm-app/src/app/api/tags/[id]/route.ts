import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

// GET /api/tags/[id] - Get a single tag
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const tag = await prisma.tag.findUnique({
      where: { id },
      include: {
        candidates: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        positions: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 })
    }

    return NextResponse.json(tag)
  } catch (error: any) {
    console.error("Error fetching tag:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT /api/tags/[id] - Update a tag
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const body = await request.json()
    const { name, color, category } = body

    const tag = await prisma.tag.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(color && { color }),
        ...(category && { category }),
      },
    })

    return NextResponse.json(tag)
  } catch (error: any) {
    console.error("Error updating tag:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/tags/[id] - Delete a tag
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    await prisma.tag.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Tag deleted successfully" })
  } catch (error: any) {
    console.error("Error deleting tag:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
