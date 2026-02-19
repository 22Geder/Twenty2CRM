import { NextResponse } from 'next/server'

// 🏥 Health Check Endpoint - לבדיקת תקינות השרת
// ==================================================

export async function GET() {
  const startTime = Date.now()
  
  try {
    // בדיקת חיבור DB
    const { prisma } = await import('@/lib/prisma')
    const dbCheck = await prisma.$queryRaw`SELECT 1 as ok`
    
    const responseTime = Date.now() - startTime
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      database: 'connected',
      responseTime: `${responseTime}ms`,
      version: '1.0.0',
      uptime: process.uptime(),
      checks: {
        database: true,
        api: true,
      }
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      database: 'disconnected',
      responseTime: `${responseTime}ms`,
      error: String(error),
      checks: {
        database: false,
        api: true,
      }
    }, { status: 503 })
  }
}
