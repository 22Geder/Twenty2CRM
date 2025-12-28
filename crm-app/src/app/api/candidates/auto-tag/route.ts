import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// זיהוי אוטומטי של תגיות מקורות חיים
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { candidateId, resumeText } = await request.json()

    if (!candidateId || !resumeText) {
      return NextResponse.json(
        { error: 'Missing candidateId or resumeText' },
        { status: 400 }
      )
    }

    // קבל את כל התגיות הקיימות
    const allTags = await prisma.tag.findMany()

    // מצא תגיות שמופיעות בקורות החיים
    const matchedTags = []
    const textLower = resumeText.toLowerCase()

    for (const tag of allTags) {
      if (textLower.includes(tag.name.toLowerCase())) {
        matchedTags.push(tag)
      }
    }

    // חבר את המועמד לתגיות שנמצאו
    if (matchedTags.length > 0) {
      await prisma.candidate.update({
        where: { id: candidateId },
        data: {
          tags: {
            connect: matchedTags.map(tag => ({ id: tag.id }))
          }
        }
      })
    }

    // עדכן את שדה הכישורים
    const skillTags = matchedTags.filter(tag => tag.type === 'SKILL')
    if (skillTags.length > 0) {
      await prisma.candidate.update({
        where: { id: candidateId },
        data: {
          skills: skillTags.map(tag => tag.name).join(', ')
        }
      })
    }

    return NextResponse.json({
      success: true,
      matchedTags: matchedTags.length,
      tags: matchedTags.map(t => t.name)
    })

  } catch (error) {
    console.error('Error auto-tagging candidate:', error)
    return NextResponse.json(
      { error: 'Failed to auto-tag candidate' },
      { status: 500 }
    )
  }
}

// קבל מועמדים לפי תגיות - 5 טכניקות סינון
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    
    // טכניקת סינון #1: לפי תגיות ספציפיות
    const tags = searchParams.get('tags')?.split(',') || []
    
    // טכניקת סינון #2: לפי שנות ניסיון מינימום
    const minExperience = parseInt(searchParams.get('minExperience') || '0')
    
    // טכניקת סינון #3: לפי דירוג
    const minRating = parseInt(searchParams.get('minRating') || '0')
    
    // טכניקת סינון #4: לפי מקור (LinkedIn, Job Board, וכו')
    const source = searchParams.get('source')
    
    // טכניקת סינון #5: לפי זמינות (תקופת הודעה מוקדמת)
    const availability = searchParams.get('availability')

    // בנה את השאילתה
    const whereClause: any = {}

    if (tags.length > 0) {
      whereClause.tags = {
        some: {
          name: {
            in: tags
          }
        }
      }
    }

    if (minExperience > 0) {
      whereClause.yearsOfExperience = {
        gte: minExperience
      }
    }

    if (minRating > 0) {
      whereClause.rating = {
        gte: minRating
      }
    }

    if (source) {
      whereClause.source = source
    }

    if (availability) {
      whereClause.noticePeriod = availability
    }

    const candidates = await prisma.candidate.findMany({
      where: whereClause,
      include: {
        tags: true,
        applications: {
          include: {
            position: {
              select: {
                title: true,
                active: true
              }
            }
          }
        },
        _count: {
          select: {
            applications: true,
            interviews: true
          }
        }
      },
      orderBy: [
        { rating: 'desc' },
        { yearsOfExperience: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({
      candidates,
      total: candidates.length,
      filters: {
        tags,
        minExperience,
        minRating,
        source,
        availability
      }
    })

  } catch (error) {
    console.error('Error filtering candidates:', error)
    return NextResponse.json(
      { error: 'Failed to filter candidates' },
      { status: 500 }
    )
  }
}
