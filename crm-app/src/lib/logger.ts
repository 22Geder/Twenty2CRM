/**
 * Logger מרכזי - TWENTY2CRM
 * שימוש: import { logger } from '@/lib/logger'
 *
 * רמות: info, warn, error, debug
 * בפרודקשן: debug מוסתר אוטומטית
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
  level: LogLevel
  message: string
  context?: string
  data?: unknown
  timestamp: string
}

const IS_PRODUCTION = process.env.NODE_ENV === 'production'
const IS_TEST = process.env.NODE_ENV === 'test'

function sanitize(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data
  const forbidden = ['password', 'token', 'secret', 'key', 'authorization', 'cookie', 'DATABASE_URL']
  return JSON.parse(JSON.stringify(data, (key, value) => {
    if (forbidden.some(f => key.toLowerCase().includes(f))) return '[REDACTED]'
    return value
  }))
}

function log(level: LogLevel, message: string, context?: string, data?: unknown) {
  if (IS_TEST) return
  if (level === 'debug' && IS_PRODUCTION) return

  const entry: LogEntry = {
    level,
    message,
    context,
    data: data ? sanitize(data) : undefined,
    timestamp: new Date().toISOString(),
  }

  const prefix = context ? `[${context}]` : ''
  const formatted = `${entry.timestamp} ${level.toUpperCase()} ${prefix} ${message}`

  switch (level) {
    case 'error':
      console.error(formatted, entry.data ?? '')
      break
    case 'warn':
      console.warn(formatted, entry.data ?? '')
      break
    case 'debug':
      console.debug(formatted, entry.data ?? '')
      break
    default:
      console.log(formatted, entry.data ?? '')
  }
}

export const logger = {
  info:  (message: string, context?: string, data?: unknown) => log('info',  message, context, data),
  warn:  (message: string, context?: string, data?: unknown) => log('warn',  message, context, data),
  error: (message: string, context?: string, data?: unknown) => log('error', message, context, data),
  debug: (message: string, context?: string, data?: unknown) => log('debug', message, context, data),

  /** לוג מובנה לאירועי API - context = שם ה-route */
  api: (method: string, path: string, status: number, durationMs?: number) =>
    log('info', `${method} ${path} → ${status}${durationMs ? ` (${durationMs}ms)` : ''}`, 'API'),

  /** לוג שגיאה עם stack trace */
  exception: (error: unknown, context?: string) => {
    const message = error instanceof Error ? error.message : String(error)
    const stack   = error instanceof Error ? error.stack  : undefined
    log('error', message, context, { stack })
  },
}
