import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { canSeeAllRecruiters } from '@/lib/recruiter-stats'
import { getCandidateCanonicalStatus } from '@/lib/candidate-status'
import { calcWorkedMinutes } from '@/lib/attendance'
import {
  CANDIDATE_HIRED_WHERE,
  CANDIDATE_IN_PROCESS_WHERE,
  CANDIDATE_REJECTED_WHERE,
} from '@/lib/candidate-status'
import {
  bucketRecruiterAttendance,
  bucketRecruiterActivity,
  currentYearMonth,
  isYear,
  scoreRecruiterMonth,
  yearMonths,
  HIRE_TARGET,
  UPLOAD_TARGET,
} from '@/lib/recruiter-performance'

const HEBREW_MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const sessionUserId = (session.user as { id?: string }).id
    const seeAll = canSeeAllRecruiters({
      role: (session.user as { role?: string }).role,
      email: session.user.email,
    })
    if (!seeAll && id !== sessionUserId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const recruiter = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, phone: true, role: true, avatar: true, active: true, createdAt: true, lastLoginAt: true },
    })
    if (!recruiter) {
      return NextResponse.json({ error: 'Recruiter not found' }, { status: 404 })
    }

    const [rows, attendanceRows, totalUploaded, totalInProcess, totalHired, totalRejected, candidateRows, assignedPositions] = await Promise.all([
      prisma.candidate.findMany({
        where: { uploadedById: id },
        select: { createdAt: true, hiredAt: true, uploadedById: true },
      }),
      prisma.attendance.findMany({
        where: { userId: id },
        select: { date: true, clockIn: true, clockOut: true, breakMinutes: true },
      }),
      prisma.candidate.count({ where: { uploadedById: id } }),
      prisma.candidate.count({ where: { uploadedById: id, ...CANDIDATE_IN_PROCESS_WHERE } }),
      prisma.candidate.count({ where: { uploadedById: id, ...CANDIDATE_HIRED_WHERE } }),
      prisma.candidate.count({ where: { uploadedById: id, ...CANDIDATE_REJECTED_WHERE } }),
      prisma.candidate.findMany({
        where: { uploadedById: id },
        orderBy: { createdAt: 'desc' },
        take: 300,
        select: {
          id: true,
          name: true,
          phone: true,
          city: true,
          currentTitle: true,
          createdAt: true,
          hiredAt: true,
          employmentStatus: true,
          inProcessPositionId: true,
          inProcessAt: true,
          interviewDate: true,
          hiredToEmployer: { select: { name: true } },
          inProcessPosition: { select: { title: true, employer: { select: { name: true } } } },
        },
      }),
      prisma.position.findMany({
        where: { recruiterId: id, active: true },
        orderBy: { updatedAt: 'desc' },
        take: 50,
        select: { id: true, title: true, openings: true, location: true, employer: { select: { name: true } } },
      }),
    ])
    const candidates = candidateRows.map((candidate) => ({
      id: candidate.id,
      name: candidate.name,
      phone: candidate.phone,
      city: candidate.city,
      currentTitle: candidate.currentTitle,
      createdAt: candidate.createdAt,
      hiredAt: candidate.hiredAt,
      inProcessAt: candidate.inProcessAt,
      interviewDate: candidate.interviewDate,
      status: getCandidateCanonicalStatus(candidate),
      employerName: candidate.hiredToEmployer?.name || candidate.inProcessPosition?.employer?.name || null,
      positionTitle: candidate.inProcessPosition?.title || null,
    }))
    const recentShifts = [...attendanceRows]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 14)
      .map((row) => ({
        date: row.date,
        clockIn: row.clockIn,
        clockOut: row.clockOut,
        workedMinutes: calcWorkedMinutes(row.clockIn, row.clockOut, row.breakMinutes),
      }))
    const { uploads, hires } = bucketRecruiterActivity(rows)
    const { workedMinutes, completedShifts: completedShiftsByMonth } = bucketRecruiterAttendance(attendanceRows)
    const uploadMonths = uploads.get(id) || new Map<string, number>()
    const hireMonths = hires.get(id) || new Map<string, number>()
    const years = Array.from(new Set([
      ...Array.from(uploadMonths.keys(), (month) => month.slice(0, 4)),
      ...Array.from(hireMonths.keys(), (month) => month.slice(0, 4)),
      ...Array.from(workedMinutes.keys(), (month) => month.slice(0, 4)),
      currentYearMonth().slice(0, 4),
    ])).filter(isYear).sort((a, b) => b.localeCompare(a))

    const yearData = years.map((year) => {
      const months = yearMonths(year).map((month) => {
        const uploaded = uploadMonths.get(month) || 0
        const hired = hireMonths.get(month) || 0
        const hoursMinutes = workedMinutes.get(month) || 0
        const completedShiftCount = completedShiftsByMonth.get(month) || 0
        return {
          month,
          label: HEBREW_MONTHS[Number(month.slice(5, 7)) - 1],
          uploaded,
          hired,
          hoursMinutes,
          completedShifts: completedShiftCount,
          ...scoreRecruiterMonth(uploaded, hired),
        }
      })
      const uploaded = months.reduce((sum, month) => sum + month.uploaded, 0)
      const hired = months.reduce((sum, month) => sum + month.hired, 0)
      const hoursMinutes = months.reduce((sum, month) => sum + month.hoursMinutes, 0)
      const completedShifts = months.reduce((sum, month) => sum + month.completedShifts, 0)
      const activeMonths = months.filter((month) => month.uploaded > 0 || month.hired > 0)
      const averageScore = activeMonths.length
        ? Math.round(activeMonths.reduce((sum, month) => sum + month.score, 0) / activeMonths.length)
        : 0

      return { year, uploaded, hired, hoursMinutes, completedShifts, averageScore, months }
    })

    return NextResponse.json({
      recruiter,
      targets: { uploads: UPLOAD_TARGET, hires: HIRE_TARGET },
      currentMonth: currentYearMonth(),
      summary: {
        totalUploaded,
        totalInProcess,
        totalHired,
        totalRejected,
      },
      years: yearData,
      candidates,
      candidatesTruncated: totalUploaded > candidates.length,
      assignedPositions,
      recentShifts,
    })
  } catch (error) {
    console.error('recruiter performance failed', error instanceof Error ? error.message : 'unknown')
    return NextResponse.json({ error: 'Failed to load recruiter performance' }, { status: 500 })
  }
}
