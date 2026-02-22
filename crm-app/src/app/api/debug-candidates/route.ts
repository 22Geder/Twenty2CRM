import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 🔧 Debug endpoint - check recent candidates
// DELETE THIS AFTER DEBUGGING!
export async function GET() {
  try {
    const candidates = await prisma.candidate.findMany({
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
    
    const count = await prisma.candidate.count();
    
    return NextResponse.json({
      total: count,
      recent: candidates
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}
