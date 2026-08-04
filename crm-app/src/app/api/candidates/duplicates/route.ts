import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

// GET /api/candidates/duplicates
// מחפש מועמדים כפולים לפי טלפון או אימייל
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Find all candidates with phone or email
    const candidates = await prisma.candidate.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        source: true,
        hiredAt: true,
      },
      orderBy: { createdAt: "asc" },
    })

    // Group by phone
    const byPhone: Record<string, typeof candidates> = {}
    for (const c of candidates) {
      if (!c.phone) continue
      const normalized = c.phone.replace(/[\s\-\(\)]/g, "")
      if (!byPhone[normalized]) byPhone[normalized] = []
      byPhone[normalized].push(c)
    }

    // Group by email
    const byEmail: Record<string, typeof candidates> = {}
    for (const c of candidates) {
      if (!c.email) continue
      const normalized = c.email.toLowerCase().trim()
      if (!byEmail[normalized]) byEmail[normalized] = []
      byEmail[normalized].push(c)
    }

    // Build duplicate groups
    const seenIds = new Set<string>()
    const groups: {
      type: "phone" | "email"
      value: string
      candidates: typeof candidates
    }[] = []

    for (const [phone, group] of Object.entries(byPhone)) {
      if (group.length > 1) {
        const groupIds = group.map((c) => c.id).sort().join(",")
        if (!seenIds.has(groupIds)) {
          seenIds.add(groupIds)
          groups.push({ type: "phone", value: phone, candidates: group })
        }
      }
    }

    for (const [email, group] of Object.entries(byEmail)) {
      if (group.length > 1) {
        const groupIds = group.map((c) => c.id).sort().join(",")
        if (!seenIds.has(groupIds)) {
          seenIds.add(groupIds)
          groups.push({ type: "email", value: email, candidates: group })
        }
      }
    }

    return NextResponse.json({
      totalGroups: groups.length,
      totalDuplicates: groups.reduce((sum, g) => sum + g.candidates.length - 1, 0),
      groups,
    })
  } catch (error) {
    console.error("GET /api/candidates/duplicates error:", error)
    return NextResponse.json({ error: "Failed to find duplicates" }, { status: 500 })
  }
}
