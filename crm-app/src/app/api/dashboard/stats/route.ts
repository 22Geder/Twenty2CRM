import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Calculate date ranges
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Fetch all stats in parallel
    const [
      totalCandidates,
      totalPositions,
      activePositions,
      totalApplications,
      totalInterviews,
      upcomingInterviews,
      totalEmployers,
      applicationsThisWeek,
      applicationsThisMonth,
      candidatesByStatus,
      recentApplications
    ] = await Promise.all([
      // Total candidates
      prisma.candidate.count(),
      
      // Total positions
      prisma.position.count(),
      
      // Active positions
      prisma.position.count({ where: { active: true } }),
      
      // Total applications
      prisma.application.count(),
      
      // Total interviews
      prisma.interview.count(),
      
      // Upcoming interviews
      prisma.interview.count({
        where: {
          scheduledAt: { gte: now },
          status: 'SCHEDULED'
        }
      }),
      
      // Total employers
      prisma.employer.count(),
      
      // Applications this week
      prisma.application.count({
        where: {
          appliedAt: { gte: weekAgo }
        }
      }),
      
      // Applications this month
      prisma.application.count({
        where: {
          appliedAt: { gte: monthAgo }
        }
      }),
      
      // Group applications by status
      prisma.application.groupBy({
        by: ['status'],
        _count: true
      }),
      
      // Recent applications for activity feed
      prisma.application.findMany({
        take: 10,
        orderBy: { appliedAt: 'desc' },
        include: {
          candidate: { select: { name: true } },
          position: { select: { title: true } }
        }
      })
    ])

    // Format candidates by status
    const statusCounts = {
      NEW: 0,
      SCREENING: 0,
      INTERVIEW: 0,
      OFFER: 0,
      HIRED: 0,
      REJECTED: 0
    }

    candidatesByStatus.forEach((item) => {
      statusCounts[item.status as keyof typeof statusCounts] = item._count
    })

    // Format recent activity
    const recentActivity = recentApplications.map((app) => ({
      id: app.id,
      type: 'application',
      description: `${app.candidate.name} הגיש/ה מועמדות למשרת ${app.position.title}`,
      date: app.appliedAt.toISOString()
    }))

    const stats = {
      totalCandidates,
      totalPositions,
      activePositions,
      totalApplications,
      totalInterviews,
      upcomingInterviews,
      totalEmployers,
      recentApplications: applicationsThisWeek,
      applicationsThisWeek,
      applicationsThisMonth,
      candidatesByStatus: statusCounts,
      recentActivity
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}
