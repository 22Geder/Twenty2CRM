import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// POST - Log a WhatsApp send
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { candidateId, candidateName, candidatePhone, positionId, positionTitle, employerName } = body

    if (!candidateId || !candidatePhone) {
      return NextResponse.json({ error: "candidateId and candidatePhone are required" }, { status: 400 })
    }

    // Create log entry and update candidate's lastWhatsAppSentAt
    const [log] = await prisma.$transaction([
      prisma.whatsAppLog.create({
        data: {
          candidateId,
          candidateName: candidateName || "",
          candidatePhone,
          positionId: positionId || null,
          positionTitle: positionTitle || null,
          employerName: employerName || null,
        },
      }),
      prisma.candidate.update({
        where: { id: candidateId },
        data: { lastWhatsAppSentAt: new Date() },
      }),
    ])

    return NextResponse.json({ success: true, log })
  } catch (error) {
    console.error("Error logging WhatsApp send:", error)
    return NextResponse.json({ error: "Failed to log WhatsApp send" }, { status: 500 })
  }
}

// GET - Get last WhatsApp sent dates for candidates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const candidateIds = searchParams.get("candidateIds")
    const candidateId = searchParams.get("candidateId")

    // Single candidate - return full history
    if (candidateId) {
      const logs = await prisma.whatsAppLog.findMany({
        where: { candidateId },
        orderBy: { sentAt: "desc" },
        take: 20,
      })
      const candidate = await prisma.candidate.findUnique({
        where: { id: candidateId },
        select: { lastWhatsAppSentAt: true },
      })
      return NextResponse.json({
        lastSentAt: candidate?.lastWhatsAppSentAt,
        logs,
      })
    }

    // Multiple candidates - return just lastWhatsAppSentAt map
    if (candidateIds) {
      const ids = candidateIds.split(",").filter(Boolean)
      if (ids.length === 0) {
        return NextResponse.json({ lastSentMap: {} })
      }
      const candidates = await prisma.candidate.findMany({
        where: { id: { in: ids } },
        select: { id: true, lastWhatsAppSentAt: true },
      })
      const lastSentMap: Record<string, string | null> = {}
      for (const c of candidates) {
        lastSentMap[c.id] = c.lastWhatsAppSentAt?.toISOString() || null
      }
      return NextResponse.json({ lastSentMap })
    }

    return NextResponse.json({ error: "Provide candidateId or candidateIds" }, { status: 400 })
  } catch (error) {
    console.error("Error fetching WhatsApp logs:", error)
    return NextResponse.json({ error: "Failed to fetch WhatsApp logs" }, { status: 500 })
  }
}
