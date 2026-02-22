import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 🔧 Debug endpoint - check recent candidates
// DELETE THIS AFTER DEBUGGING!
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    
    let candidates;
    
    if (search) {
      // Search by name
      candidates = await prisma.candidate.findMany({
        where: {
          name: {
            contains: search,
            mode: 'insensitive'
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          source: true,
          createdAt: true,
          uploadedById: true,
        }
      });
    } else {
      candidates = await prisma.candidate.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          source: true,
          createdAt: true,
          uploadedById: true,
        }
      });
    }
    
    const count = await prisma.candidate.count();
    
    return NextResponse.json({
      total: count,
      search: search || 'none',
      results: candidates.length,
      recent: candidates
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}
