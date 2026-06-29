import { NextResponse } from 'next/server'
export async function GET() {
  return NextResponse.json({ ok: true, deployTest: 'JUNE29-1253', ts: new Date().toISOString() })
}
