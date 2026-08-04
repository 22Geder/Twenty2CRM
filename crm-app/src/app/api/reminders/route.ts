import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

// GET /api/reminders - רשימת תזכורות
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const completed = searchParams.get("completed")
    const priority = searchParams.get("priority")
    const type = searchParams.get("type")

    const where: Record<string, unknown> = {}
    if (completed !== null) where.completed = completed === "true"
    if (priority) where.priority = priority
    if (type) where.type = type

    const reminders = await prisma.reminder.findMany({
      where,
      orderBy: [{ completed: "asc" }, { dueDate: "asc" }],
    })

    // Enrich with candidate names manually (no @relation in schema)
    const candidateIds = [...new Set(reminders.filter((r) => r.candidateId).map((r) => r.candidateId!))]
    const userIds = [...new Set(reminders.map((r) => r.userId))]

    const [candidates, users] = await Promise.all([
      candidateIds.length
        ? prisma.candidate.findMany({
            where: { id: { in: candidateIds } },
            select: { id: true, name: true, phone: true },
          })
        : Promise.resolve([]),
      userIds.length
        ? prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true },
          })
        : Promise.resolve([]),
    ])

    const candidateMap = Object.fromEntries(candidates.map((c) => [c.id, c]))
    const userMap = Object.fromEntries(users.map((u) => [u.id, u]))

    const enriched = reminders.map((r) => ({
      ...r,
      candidateName: r.candidateId ? candidateMap[r.candidateId]?.name : null,
      candidatePhone: r.candidateId ? candidateMap[r.candidateId]?.phone : null,
      userName: userMap[r.userId]?.name || "לא ידוע",
    }))

    return NextResponse.json(enriched)
  } catch (error) {
    console.error("GET /api/reminders error:", error)
    return NextResponse.json({ error: "Failed to fetch reminders" }, { status: 500 })
  }
}

// POST /api/reminders - יצירת תזכורת חדשה
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { title, description, dueDate, priority, type, candidateId, positionId } = body

    if (!title || !dueDate || !type) {
      return NextResponse.json({ error: "title, dueDate, type הם שדות חובה" }, { status: 400 })
    }

    const reminder = await prisma.reminder.create({
      data: {
        title: String(title).slice(0, 255),
        description: description ? String(description).slice(0, 1000) : null,
        dueDate: new Date(dueDate),
        priority: priority || "MEDIUM",
        type: String(type),
        candidateId: candidateId || null,
        positionId: positionId || null,
        userId: (session.user as { id: string }).id,
      },
    })

    return NextResponse.json(reminder, { status: 201 })
  } catch (error) {
    console.error("POST /api/reminders error:", error)
    return NextResponse.json({ error: "Failed to create reminder" }, { status: 500 })
  }
}
