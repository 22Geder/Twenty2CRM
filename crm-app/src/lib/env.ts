// Helper to read env vars at runtime with multiple fallbacks.
// Next.js inlines process.env.RESEND_* at build time (often empty on Railway),
// so Resend keys must be read from files written at process start.

function nonEmpty(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed || undefined
}

function readRuntimeFileValue(key: string): string | undefined {
  try {
    // Lazy require keeps this on the Node runtime, not the Next build inliner.
    const fs = require('fs') as typeof import('fs')
    const path = require('path') as typeof import('path')
    const roots = Array.from(new Set([process.cwd(), __dirname].filter(Boolean)))

    for (const root of roots) {
      const envLocalPath = path.join(root, '.env.local')
      if (fs.existsSync(envLocalPath)) {
        const content = fs.readFileSync(envLocalPath, 'utf-8')
        const match = content.split(/\r?\n/).find((line) => line.startsWith(key + '='))
        const fromFile = match ? nonEmpty(match.split('=').slice(1).join('=')) : undefined
        if (fromFile) return fromFile
      }

      const jsonPath = path.join(root, 'runtime-env.json')
      if (fs.existsSync(jsonPath)) {
        const config = JSON.parse(fs.readFileSync(jsonPath, 'utf-8')) as Record<string, unknown>
        const fromJson = nonEmpty(config[key])
        if (fromJson) return fromJson
      }
    }
  } catch {}

  return undefined
}

function envKey(key: string): string | undefined {
  return nonEmpty(process.env[key]) || readRuntimeFileValue(key)
}

export function getResendApiKey(): string | undefined {
  return readRuntimeFileValue('RESEND_API_KEY') || envKey('RESEND_API_KEY')
}

export function getResendFromEmail(): string {
  return readRuntimeFileValue('RESEND_FROM_EMAIL') || envKey('RESEND_FROM_EMAIL') || 'office@hr22group.com'
}
