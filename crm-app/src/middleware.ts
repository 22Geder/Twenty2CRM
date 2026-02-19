import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 🔐 Next.js Middleware - מושבת זמנית לדיבאג Railway
// ==================================
// TODO: להפעיל מחדש אחרי שRailway עובד

export function middleware(request: NextRequest) {
  // מושבת זמנית - כל הבקשות עוברות
  return NextResponse.next()
  
  /* DISABLED FOR DEBUGGING
  const { pathname } = request.nextUrl
  
  // רק API routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next()
  }
  
  // דלג על נתיבים פתוחים
  const openRoutes = [
    '/api/auth',
    '/api/unsubscribe',
    '/api/email-webhook',
    '/api/sms-webhook',
    '/api/gmail-webhook',
    '/api/gmail-callback',
  ]
  
  if (openRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }
  
  // קבל IP
  const ip = getClientIp(request)
  
  // בדוק Rate Limiting
  const rateLimitResult = checkRateLimit(ip, pathname)
  
  if (!rateLimitResult.allowed) {
    console.log(`⚠️ Rate limit exceeded for ${ip} on ${pathname}`)
    return createRateLimitResponse(rateLimitResult.resetIn)
  }
  
  // בדוק API Key לנתיבים מוגנים
  if (isProtectedRoute(pathname)) {
    if (!validateApiKey(request)) {
      console.log(`🔒 Unauthorized access attempt to ${pathname} from ${ip}`)
      return createUnauthorizedResponse()
    }
  }
  
  // הוסף headers של Rate Limiting לתגובה
  const response = NextResponse.next()
  response.headers.set('X-RateLimit-Remaining', String(rateLimitResult.remaining))
  response.headers.set('X-RateLimit-Reset', String(Math.ceil(rateLimitResult.resetIn / 1000)))
  
  return response
  */
}

// הגדר על אילו נתיבים ה-middleware רץ
export const config = {
  matcher: [
    '/api/:path*',
  ],
}
