import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

// PATCH /api/reminders/[id] - עדכון תזכורת
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { title, description, dueDate, priority, type, completed, candidateId, positionId } = body

    const existing = await prisma.reminder.findUnique({ where: { id: params.id } })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const updated = await prisma.reminder.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title: String(title).slice(0, 255) }),
        ...(description !== undefined && { description: description ? String(description).slice(0, 1000) : null }),
        ...(dueDate !== undefined && { dueDate: new Date(dueDate) }),
        ...(priority !== undefined && { priority }),
        ...(type !== undefined && { type }),
        ...(candidateId !== undefined && { candidateId: candidateId || null }),
        ...(positionId !== undefined && { positionId: positionId || null }),
        ...(completed !== undefined && {
          completed: Boolean(completed),
          completedAt: completed ? new Date() : null,
        }),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("PATCH /api/reminders/[id] error:", error)
    return NextResponse.json({ error: "Failed to update reminder" }, { status: 500 })
  }
}

// DELETE /api/reminders/[id] - מחיקת תזכורת
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const existing = await prisma.reminder.findUnique({ where: { id: params.id } })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    await prisma.reminder.delete({ where: { id: params.id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/reminders/[id] error:", error)
    return NextResponse.json({ error: "Failed to delete reminder" }, { status: 500 })
  }
}
