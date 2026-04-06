import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ ok: true, route: 'sync-oshpir-tags', time: new Date().toISOString() })
}

export async function POST() {
  return NextResponse.json({ ok: true, route: 'sync-oshpir-tags', method: 'POST' })
}
