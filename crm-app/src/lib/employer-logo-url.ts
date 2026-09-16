const INTERNAL_LOGO_URL = /^\/api\/employers\/logo\/([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(png|jpg|webp))$/i
const LOGO_FILENAME = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(png|jpg|webp)$/i

export function isEmployerLogoFilename(filename: string): boolean {
  return LOGO_FILENAME.test(filename)
}

export function employerLogoUrl(filename: string): string {
  return `/api/employers/logo/${filename}`
}

export function parseEmployerLogoFilename(url: unknown): string | null {
  if (typeof url !== 'string') return null
  const match = INTERNAL_LOGO_URL.exec(url.trim())
  return match ? match[1].toLowerCase() : null
}

export function sanitizeEmployerLogoUrl(logo: unknown): string | null {
  const filename = parseEmployerLogoFilename(logo)
  return filename ? employerLogoUrl(filename) : null
}

export function isSafeCrmLogoSrc(logo?: string | null): boolean {
  return sanitizeEmployerLogoUrl(logo) !== null
}