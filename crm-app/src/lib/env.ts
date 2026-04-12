// Helper to read env vars at runtime
// Values are injected into process.env by instrumentation.ts at server startup

function envKey(key: string): string | undefined {
  // Use dynamic property access to prevent Next.js build-time inlining
  const env = process.env
  return env[key] || undefined
}

export function getResendApiKey(): string | undefined {
  return envKey('RESEND_API_KEY')
}

export function getResendFromEmail(): string {
  return envKey('RESEND_FROM_EMAIL') || 'onboarding@resend.dev'
}
