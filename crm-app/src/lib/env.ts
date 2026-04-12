// Helper to read env vars at runtime
// Reads from runtime-env.json (written by start-with-retry.js before Next.js starts)
// Falls back to process.env for local development
import { readFileSync } from 'fs'
import { join } from 'path'

let _runtimeConfig: Record<string, string> | null = null

function getRuntimeConfig(): Record<string, string> {
  if (!_runtimeConfig) {
    try {
      const filePath = join(process.cwd(), 'runtime-env.json')
      _runtimeConfig = JSON.parse(readFileSync(filePath, 'utf-8'))
    } catch {
      _runtimeConfig = {}
    }
  }
  return _runtimeConfig
}

function envKey(key: string): string | undefined {
  const val = process.env[key]
  if (val && val.length > 0) return val
  return getRuntimeConfig()[key] || undefined
}

export function getResendApiKey(): string | undefined {
  return envKey('RESEND_API_KEY')
}

export function getResendFromEmail(): string {
  return envKey('RESEND_FROM_EMAIL') || 'onboarding@resend.dev'
}
