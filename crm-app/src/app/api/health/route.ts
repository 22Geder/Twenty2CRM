import { NextResponse } from 'next/server'

// 🏥 Health Check Endpoint - לבדיקת תקינות השרת
// ==================================================

export async function GET() {
  const startTime = Date.now()
  
  const diagnostics: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database_url_set: !!process.env.DATABASE_URL,
    database_url_prefix: process.env.DATABASE_URL?.substring(0, 20) + '...',
  }
  
  try {
    // בדיקת חיבור DB
    const { prisma } = await import('@/lib/prisma')
    
    // ספור מועמדים כבדיקה  
    const candidateCount = await prisma.candidate.count()
    const positionCount = await prisma.position.count()
    
    const responseTime = Date.now() - startTime
    
    return NextResponse.json({
      status: 'healthy',
      ...diagnostics,
      database: 'connected',
      responseTime: `${responseTime}ms`,
      counts: {
        candidates: candidateCount,
        positions: positionCount,
      },
      checks: {
        database: true,
        api: true,
      }
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    
    return NextResponse.json({
      status: 'unhealthy',
      ...diagnostics,
      database: 'disconnected',
      responseTime: `${responseTime}ms`,
      error: String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      checks: {
        database: false,
        api: true,
      }
    }, { status: 503 })
  }
}
