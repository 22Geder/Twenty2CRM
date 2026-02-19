import { NextResponse } from 'next/server'

// 🔍 Diagnostic Endpoint - בדיקה בסיסית ללא DB
// ================================================

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'API is working!',
    env: {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL_SET: !!process.env.DATABASE_URL,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    }
  })
}
