// Helper to read env vars at runtime with multiple fallbacks
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function envKey(key: string): string | undefined {
  // Method 1: Dynamic property access on process.env
  const env = process.env
  const val = env[key]
  if (val) return val

  // Method 2: Read from .env.local file (written by start-with-retry.js)
  try {
    const envLocalPath = join(process.cwd(), '.env.local');
    if (existsSync(envLocalPath)) {
      const content = readFileSync(envLocalPath, 'utf-8');
      const match = content.split('\n').find(line => line.startsWith(key + '='));
      if (match) return match.split('=').slice(1).join('=').trim();
    }
  } catch {}

  // Method 3: Read from runtime-env.json
  try {
    const jsonPath = join(process.cwd(), 'runtime-env.json');
    if (existsSync(jsonPath)) {
      const config = JSON.parse(readFileSync(jsonPath, 'utf-8'));
      if (config[key]) return config[key];
    }
  } catch {}

  return undefined
}

export function getResendApiKey(): string | undefined {
  // Next.js inlines only statically referenced env keys into the server bundle.
  // Dynamic access like process.env[key] is stripped, so production saw Resend as missing.
  return process.env.RESEND_API_KEY || envKey('RESEND_API_KEY')
}

export function getResendFromEmail(): string {
  return process.env.RESEND_FROM_EMAIL || envKey('RESEND_FROM_EMAIL') || 'office@hr22group.com'
}
