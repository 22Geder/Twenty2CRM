import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/export-positions?key=twenty2export2026 — Export all active positions for website sync
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const key = searchParams.get('key')
  if (key !== 'twenty2export2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const positions = await prisma.position.findMany({
      where: { active: true },
      include: {
        employer: {
          select: { id: true, name: true, email: true, phone: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      count: positions.length,
      positions: positions.map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        requirements: p.requirements,
        location: p.location,
        salaryRange: p.salaryRange,
        employmentType: p.employmentType,
        keywords: p.keywords,
        openings: p.openings,
        contactEmail: p.contactEmail,
        contactName: p.contactName,
        employer: p.employer ? {
          name: p.employer.name,
          email: p.employer.email,
          phone: p.employer.phone
        } : null,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt
      }))
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Export failed', details: String(error) }, { status: 500 })
  }
}
