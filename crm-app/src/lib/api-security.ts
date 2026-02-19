// 🔐 API Security - API Keys & Rate Limiting
// ============================================

// מפת Rate Limiting - שומר את הבקשות לפי IP
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

// הגדרות Rate Limiting
const RATE_LIMIT_CONFIG = {
  windowMs: 60 * 1000, // חלון זמן של דקה
  maxRequests: 100, // מקסימום 100 בקשות בדקה
  sensitiveRoutes: {
    '/api/backup': { maxRequests: 5, windowMs: 60 * 60 * 1000 }, // 5 בקשות בשעה
    '/api/restore': { maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 3 בקשות בשעה
    '/api/candidates/bulk-delete': { maxRequests: 10, windowMs: 60 * 1000 }, // 10 בדקה
    '/api/send-bulk-email': { maxRequests: 20, windowMs: 60 * 60 * 1000 }, // 20 בשעה
    '/api/send-bulk-sms': { maxRequests: 20, windowMs: 60 * 60 * 1000 }, // 20 בשעה
  } as Record<string, { maxRequests: number; windowMs: number }>
}

// רשימת API Keys (בפרודקשן יש לשמור ב-env או בבסיס נתונים)
const API_KEYS = new Set([
  process.env.ADMIN_API_KEY || 'twenty2crm-admin-key-2024',
  process.env.CRON_SECRET || 'twenty2crm-backup-2024',
])

// נתיבים שדורשים API Key
const PROTECTED_ROUTES = [
  '/api/backup',
  '/api/restore',
  '/api/candidates/bulk-delete',
  '/api/admin',
]

/**
 * בודק אם יש API Key תקין
 */
export function validateApiKey(request: Request): boolean {
  const apiKey = request.headers.get('x-api-key') || 
                 new URL(request.url).searchParams.get('api_key') ||
                 new URL(request.url).searchParams.get('secret')
  
  if (!apiKey) return false
  return API_KEYS.has(apiKey)
}

/**
 * בודק אם הנתיב מוגן
 */
export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route))
}

/**
 * בודק Rate Limiting
 * @returns true אם הבקשה מותרת, false אם חסום
 */
export function checkRateLimit(ip: string, pathname: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  
  // בדוק אם יש הגדרות מיוחדות לנתיב הזה
  const routeConfig = RATE_LIMIT_CONFIG.sensitiveRoutes[pathname]
  const maxRequests = routeConfig?.maxRequests || RATE_LIMIT_CONFIG.maxRequests
  const windowMs = routeConfig?.windowMs || RATE_LIMIT_CONFIG.windowMs
  
  const key = `${ip}:${pathname}`
  const current = rateLimitMap.get(key)
  
  // אם אין רשומה או שהחלון הסתיים - אפס
  if (!current || current.resetTime < now) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1, resetIn: windowMs }
  }
  
  // הוסף לספירה
  current.count++
  
  // בדוק אם עברנו את הלימיט
  if (current.count > maxRequests) {
    return { 
      allowed: false, 
      remaining: 0, 
      resetIn: current.resetTime - now 
    }
  }
  
  return { 
    allowed: true, 
    remaining: maxRequests - current.count, 
    resetIn: current.resetTime - now 
  }
}

/**
 * ניקוי רשומות ישנות (לקרוא מדי פעם)
 */
export function cleanupRateLimitMap(): void {
  const now = Date.now()
  for (const [key, value] of rateLimitMap.entries()) {
    if (value.resetTime < now) {
      rateLimitMap.delete(key)
    }
  }
}

/**
 * מחזיר את כתובת ה-IP מהבקשה
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp
  return '127.0.0.1'
}

/**
 * יוצר Response של Rate Limit
 */
export function createRateLimitResponse(resetIn: number): Response {
  return new Response(JSON.stringify({
    error: 'Too Many Requests',
    message: 'יותר מדי בקשות. נסה שוב מאוחר יותר.',
    retryAfter: Math.ceil(resetIn / 1000)
  }), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'Retry-After': String(Math.ceil(resetIn / 1000))
    }
  })
}

/**
 * יוצר Response של API Key חסר
 */
export function createUnauthorizedResponse(): Response {
  return new Response(JSON.stringify({
    error: 'Unauthorized',
    message: 'נדרש API Key לגישה לנתיב זה'
  }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' }
  })
}

// ניקוי אוטומטי כל 5 דקות
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitMap, 5 * 60 * 1000)
}
