import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/activity-logs - Get activity logs with filters
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const candidateId = searchParams.get('candidateId');
    const applicationId = searchParams.get('applicationId');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {};
    if (candidateId) {
      where.application = {
        candidateId
      };
    }
    if (applicationId) {
      where.applicationId = applicationId;
    }

    const logs = await prisma.activityLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        application: {
          include: {
            candidate: {
              select: {
                id: true,
                name: true
              }
            },
            position: {
              select: {
                id: true,
                title: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return NextResponse.json(
      { error: 'שגיאה בטעינת היסטוריית פעילות' },
      { status: 500 }
    );
  }
}

// POST /api/activity-logs - Create activity log
export async function POST(req: NextRequest) {
  try {
    const { type, description, metadata, userId, applicationId } = await req.json();

    if (!type || !description) {
      return NextResponse.json(
        { error: 'Type and description are required' },
        { status: 400 }
      );
    }

    const log = await prisma.activityLog.create({
      data: {
        type,
        description,
        metadata: metadata ? JSON.stringify(metadata) : null,
        userId,
        applicationId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(log);
  } catch (error) {
    console.error('Error creating activity log:', error);
    return NextResponse.json(
      { error: 'שגיאה ביצירת לוג' },
      { status: 500 }
    );
  }
}
