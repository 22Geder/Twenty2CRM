import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 🔐 Next.js Middleware - מושבת לחלוטין
// ==================================
// ה-middleware הזה גרם לשגיאות בגלל node:crypto
// כל הבקשות עוברות ישירות

export function middleware(_request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [],
}
