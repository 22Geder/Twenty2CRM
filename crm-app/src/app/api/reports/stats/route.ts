import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const now = new Date()
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // ── Basic KPIs ──────────────────────────────────────────────
    const [
      totalCandidates,
      newThisMonth,
      newThisWeek,
      totalPositions,
      activePositions,
      totalInterviews,
      upcomingInterviews,
      hiredTotal,
      hiredThisMonth,
      totalApplications,
      totalEmployers,
      whatsappTotal,
      emailsToEmployers,
    ] = await Promise.all([
      prisma.candidate.count(),
      prisma.candidate.count({ where: { createdAt: { gte: monthAgo } } }),
      prisma.candidate.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.position.count(),
      prisma.position.count({ where: { active: true } }),
      prisma.interview.count(),
      prisma.interview.count({
        where: { scheduledAt: { gte: now }, status: "SCHEDULED" },
      }),
      prisma.candidate.count({ where: { hiredAt: { not: null } } }),
      prisma.candidate.count({ where: { hiredAt: { gte: monthAgo } } }),
      prisma.application.count(),
      prisma.employer.count(),
      prisma.whatsAppLog.count(),
      prisma.employerEmailHistory.count(),
    ])

    // ── Avg Time to Hire (days) ──────────────────────────────────
    const hiredSample = await prisma.candidate.findMany({
      where: { hiredAt: { not: null } },
      select: { createdAt: true, hiredAt: true },
      take: 200,
    })
    let avgTimeToHire = 0
    if (hiredSample.length > 0) {
      const totalDays = hiredSample.reduce((sum, c) => {
        const days = Math.floor(
          (c.hiredAt!.getTime() - c.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        )
        return sum + Math.max(0, days)
      }, 0)
      avgTimeToHire = Math.round(totalDays / hiredSample.length)
    }

    // ── Placement rate ───────────────────────────────────────────
    const placementRate =
      totalCandidates > 0 ? Math.round((hiredTotal / totalCandidates) * 100) : 0

    // ── Applications by status ───────────────────────────────────
    const applicationsByStatus = await prisma.application.groupBy({
      by: ["status"],
      _count: { status: true },
      orderBy: { _count: { status: "desc" } },
    })

    // ── Source breakdown ─────────────────────────────────────────
    const sourceRaw = await prisma.candidate.groupBy({
      by: ["source"],
      _count: { source: true },
      where: { source: { not: null } },
      orderBy: { _count: { source: "desc" } },
      take: 10,
    })

    // ── Monthly data (last 12 months) ────────────────────────────
    const twelveMonthsAgo = new Date(now)
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11)
    twelveMonthsAgo.setDate(1)
    twelveMonthsAgo.setHours(0, 0, 0, 0)

    const [candidatesRaw, hiredRaw] = await Promise.all([
      prisma.candidate.findMany({
        where: { createdAt: { gte: twelveMonthsAgo } },
        select: { createdAt: true },
      }),
      prisma.candidate.findMany({
        where: { hiredAt: { gte: twelveMonthsAgo, not: null } },
        select: { hiredAt: true },
      }),
    ])

    const monthlyData: Record<string, { label: string; new: number; hired: number }> = {}
    const hebrewMonths = ["ינו", "פבר", "מרץ", "אפר", "מאי", "יונ", "יול", "אוג", "ספט", "אוק", "נוב", "דצמ"]
    for (let i = 0; i < 12; i++) {
      const d = new Date(twelveMonthsAgo)
      d.setMonth(d.getMonth() + i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      monthlyData[key] = { label: hebrewMonths[d.getMonth()], new: 0, hired: 0 }
    }
    for (const c of candidatesRaw) {
      const key = `${c.createdAt.getFullYear()}-${String(c.createdAt.getMonth() + 1).padStart(2, "0")}`
      if (monthlyData[key]) monthlyData[key].new++
    }
    for (const c of hiredRaw) {
      if (!c.hiredAt) continue
      const key = `${c.hiredAt.getFullYear()}-${String(c.hiredAt.getMonth() + 1).padStart(2, "0")}`
      if (monthlyData[key]) monthlyData[key].hired++
    }

    // ── Recent activity ──────────────────────────────────────────
    const activityTypeMap: Record<string, string> = {
      CANDIDATE_APPLIED: "מועמד הגיש מועמדות",
      STATUS_CHANGED: "סטטוס עודכן",
      INTERVIEW_SCHEDULED: "ראיון נקבע",
      INTERVIEW_COMPLETED: "ראיון הושלם",
      NOTE_ADDED: "הערה נוספה",
      DOCUMENT_UPLOADED: "מסמך הועלה",
      EMAIL_SENT: "מייל נשלח",
      OFFER_SENT: "הצעה נשלחה",
    }

    const recentActivity = await prisma.activityLog.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true } },
        application: {
          include: {
            candidate: { select: { name: true } },
            position: { select: { title: true } },
          },
        },
      },
    })

    // ── Top positions by applications ────────────────────────────
    const topPositionsRaw = await prisma.application.groupBy({
      by: ["positionId"],
      _count: { positionId: true },
      orderBy: { _count: { positionId: "desc" } },
      take: 5,
    })
    const positionDetails = await prisma.position.findMany({
      where: { id: { in: topPositionsRaw.map((p) => p.positionId) } },
      select: { id: true, title: true, employer: { select: { name: true } } },
    })

    // ── Recruiter performance ────────────────────────────────────
    const recruiterStats = await prisma.application.groupBy({
      by: ["candidateId"],
      _count: { candidateId: true },
      where: { appliedAt: { gte: monthAgo } },
    })

    // ── Build response ───────────────────────────────────────────
    return NextResponse.json({
      totals: {
        totalCandidates,
        newThisMonth,
        newThisWeek,
        totalPositions,
        activePositions,
        totalInterviews,
        upcomingInterviews,
        hiredTotal,
        hiredThisMonth,
        totalApplications,
        totalEmployers,
        placementRate,
        avgTimeToHire,
        whatsappTotal,
        emailsToEmployers,
      },
      applicationsByStatus: applicationsByStatus.map((a) => ({
        status: a.status,
        count: a._count.status,
      })),
      sourceBreakdown: sourceRaw.map((s) => ({
        source: s.source || "לא ידוע",
        count: s._count.source,
      })),
      monthlyData: Object.values(monthlyData),
      recentActivity: recentActivity.map((a) => ({
        id: a.id,
        type: activityTypeMap[a.type] || a.type,
        description: a.description,
        createdAt: a.createdAt,
        userName: a.user?.name || "מערכת",
        candidateName: a.application?.candidate?.name,
        positionTitle: a.application?.position?.title,
      })),
      topPositions: topPositionsRaw.map((p) => {
        const details = positionDetails.find((d) => d.id === p.positionId)
        return {
          positionId: p.positionId,
          count: p._count.positionId,
          title: details?.title || "לא ידוע",
          employer: details?.employer?.name || "",
        }
      }),
    })
  } catch (error) {
    console.error("Reports stats error:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
