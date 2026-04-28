import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 🔒 הגנת אבטחה - Middleware ראשי
// חוסם גישה ל-/admin, מוסיף headers אבטחה, הגנה מפני brute force

// נתיב סודי לכניסת אדמין - שמור את הקישור הזה!
// הנתיב: /t22-secure-panel-8af3x9km
const SECRET_ADMIN_PATH = '/t22-secure-panel-8af3x9km'

// Rate limiting בזיכרון (per IP)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 15 * 60 * 1000 // 15 דקות
const RATE_LIMIT_MAX = 30 // מקסימום 30 בקשות בחלון זמן
const RATE_LIMIT_MAX_MAP_SIZE = 1000 // מקסימום רשומות בזיכרון

// Brute force protection for login
const loginAttemptMap = new Map<string, { count: number; resetTime: number }>()
const LOGIN_WINDOW = 5 * 60 * 1000 // 5 דקות
const LOGIN_MAX_ATTEMPTS = 5 // מקסימום 5 ניסיונות לפי IP ב-5 דקות
const LOGIN_MAX_MAP_SIZE = 500 // מקסימום רשומות בזיכרון

// ניקוי תקופתי - cleanup כל 5 דקות
let lastCleanup = Date.now()
const CLEANUP_INTERVAL = 5 * 60 * 1000 // 5 דקות

function cleanupExpiredEntries() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) rateLimitMap.delete(key)
  }
  for (const [key, value] of loginAttemptMap.entries()) {
    if (now > value.resetTime) loginAttemptMap.delete(key)
  }
}

function enforceMapSizeLimit<V>(map: Map<string, V>, maxSize: number) {
  if (map.size <= maxSize) return
  // מחיקת הרשומות הישנות ביותר (FIFO)
  const toDelete = map.size - maxSize
  let deleted = 0
  for (const key of map.keys()) {
    if (deleted >= toDelete) break
    map.delete(key)
    deleted++
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
             request.headers.get('x-real-ip') || 
             'unknown'

  // ============================================
  // 🚫 חסימת גישה ל-/admin - מחזיר 404
  // ============================================
  if (
    pathname === '/admin' || 
    pathname.startsWith('/admin/') ||
    pathname === '/administrator' ||
    pathname.startsWith('/administrator/') ||
    pathname === '/wp-admin' ||
    pathname.startsWith('/wp-admin/') ||
    pathname === '/wp-login.php' ||
    pathname.startsWith('/wp-login') ||
    pathname === '/phpmyadmin' ||
    pathname.startsWith('/phpmyadmin/') ||
    pathname === '/.env' ||
    pathname.startsWith('/.env') ||
    pathname === '/config' ||
    pathname.startsWith('/config/') ||
    pathname.endsWith('.sql') ||
    pathname.endsWith('.bak') ||
    pathname.endsWith('.log')
  ) {
    // צור תשובת 404 - כאילו הדף לא קיים
    return new NextResponse('Not Found', { 
      status: 404,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      }
    })
  }

  // ============================================
  // 🔒 Rate Limiting - הגנה מפני מתקפות DDoS
  // ============================================
  if (pathname.startsWith('/api/') || pathname === '/login') {
    const now = Date.now()
    const key = `${ip}-general`
    const rateLimitData = rateLimitMap.get(key)

    if (rateLimitData) {
      if (now > rateLimitData.resetTime) {
        rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
      } else if (rateLimitData.count >= RATE_LIMIT_MAX) {
        return new NextResponse(JSON.stringify({ error: 'Too many requests' }), {
          status: 429,
          headers: { 'Content-Type': 'application/json', 'Retry-After': '900' }
        })
      } else {
        rateLimitData.count++
      }
    } else {
      rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    }
  }

  // ============================================
  // 🔒 Login Rate Limiting - הגנה מפני brute force
  // ============================================
  if (pathname === '/api/auth/callback/credentials' && request.method === 'POST') {
    const now = Date.now()
    const loginKey = `${ip}-login`
    const loginData = loginAttemptMap.get(loginKey)

    if (loginData) {
      if (now > loginData.resetTime) {
        loginAttemptMap.set(loginKey, { count: 1, resetTime: now + LOGIN_WINDOW })
      } else if (loginData.count >= LOGIN_MAX_ATTEMPTS) {
        return new NextResponse(JSON.stringify({ 
          error: 'יותר מדי ניסיונות התחברות. נסה שוב בעוד 5 דקות.' 
        }), {
          status: 429,
          headers: { 'Content-Type': 'application/json', 'Retry-After': '300' }
        })
      } else {
        loginData.count++
      }
    } else {
      loginAttemptMap.set(loginKey, { count: 1, resetTime: now + LOGIN_WINDOW })
    }
  }

  // ============================================
  // 🛡️ Security Headers - הגנה מפני התקפות שונות
  // ============================================
  const response = NextResponse.next()

  // מניעת XSS
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // מניעת Clickjacking
  response.headers.set('X-Frame-Options', 'DENY')
  
  // מניעת MIME sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')
  
  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Permissions Policy - חסום גישה לחיישנים מיותרים
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self), payment=()')
  
  // מניעת חשיפת מידע על השרת
  response.headers.set('X-Powered-By', '')
  
  // Strict Transport Security - אילוץ HTTPS
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  
  // Content Security Policy
  response.headers.set('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: blob: https:; " +
    "connect-src 'self' https:; " +
    "frame-ancestors 'none';"
  )

  // ============================================
  // 🔒 הגנה על נתיב האדמין הסודי
  // ============================================
  if (pathname.startsWith(SECRET_ADMIN_PATH)) {
    // מותר - הנתיב הסודי פעיל
    return response
  }

  // ניקוי תקופתי + הגבלת גודל map
  cleanupExpiredEntries()
  enforceMapSizeLimit(rateLimitMap, RATE_LIMIT_MAX_MAP_SIZE)
  enforceMapSizeLimit(loginAttemptMap, LOGIN_MAX_MAP_SIZE)

  return response
}

export const config = {
  matcher: [
    // הפעל middleware על כל הנתיבים חוץ מקבצים סטטיים
    '/((?!_next/static|_next/image|favicon.ico|icons|logo|manifest|sw).*)',
  ],
}
