import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { promises as fs } from "fs"
import path from "path"

const allowedTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]

// POST /api/candidates/[id]/documents - העלאת מסמך למועמד
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const candidate = await prisma.candidate.findUnique({ where: { id } })
    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const type = (formData.get("type") as string) || "OTHER"

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    if (!allowedTypes.includes(file.type.toLowerCase())) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "candidates", id)
    await fs.mkdir(uploadDir, { recursive: true })

    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9\u05D0-\u05EA.\-_]/g, "_")
    const filename = `${timestamp}_${safeName}`
    const filepath = path.join(uploadDir, filename)

    const bytes = await file.arrayBuffer()
    await fs.writeFile(filepath, Buffer.from(bytes))

    const document = await prisma.document.create({
      data: {
        name: file.name,
        type,
        url: `/uploads/candidates/${id}/${filename}`,
        size: file.size,
        mimeType: file.type,
        candidateId: id,
      },
    })

    return NextResponse.json({ document }, { status: 201 })
  } catch (error) {
    console.error("Error uploading candidate document:", error)
    return NextResponse.json(
      { error: "Failed to upload document" },
      { status: 500 }
    )
  }
}
