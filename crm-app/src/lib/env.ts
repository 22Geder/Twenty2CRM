// Helper to read env vars at runtime (prevents Next.js build-time inlining)
const envKey = (key: string): string | undefined => {
  return process.env[key]
}

export function getResendApiKey(): string | undefined {
  return envKey('RESEND_API_KEY')
}

export function getResendFromEmail(): string {
  return envKey('RESEND_FROM_EMAIL') || 'onboarding@resend.dev'
}
