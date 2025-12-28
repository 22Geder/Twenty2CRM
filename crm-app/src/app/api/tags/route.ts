import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

// GET /api/tags - Get all tags
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const category = searchParams.get("category")

    const tags = await prisma.tag.findMany({
      where: {
        ...(search && {
          name: {
            contains: search,
          },
        }),
        ...(category && { category }),
      },
      include: {
        _count: {
          select: {
            candidates: true,
            positions: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json(tags)
  } catch (error: any) {
    console.error("Error fetching tags:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/tags - Create a new tag
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, color, category } = body

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    // Check if tag already exists
    const existingTag = await prisma.tag.findFirst({
      where: { name: { equals: name } },
    })

    if (existingTag) {
      return NextResponse.json({ error: "Tag already exists" }, { status: 400 })
    }

    const tag = await prisma.tag.create({
      data: {
        name,
        color: color || "#3B82F6",
      },
    })

    return NextResponse.json(tag, { status: 201 })
  } catch (error: any) {
    console.error("Error creating tag:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
