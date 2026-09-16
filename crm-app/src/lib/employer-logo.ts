import { join } from 'path'
import { getUploadsBasePath } from '@/lib/storage-config'
import {
  hasImageUploadSignature,
  MAX_IMAGE_UPLOAD_BYTES,
} from '@/lib/image-upload-validation'
export {
  employerLogoUrl,
  isEmployerLogoFilename,
  isSafeCrmLogoSrc,
  parseEmployerLogoFilename,
  sanitizeEmployerLogoUrl,
} from '@/lib/employer-logo-url'

export const MAX_EMPLOYER_LOGO_BYTES = Math.min(2 * 1024 * 1024, MAX_IMAGE_UPLOAD_BYTES)
export const EMPLOYER_LOGOS_DIR = 'employer-logos'

const LOGO_FORMATS = [
  { kind: 'png' as const, extension: '.png', mimeTypes: ['image/png'] },
  { kind: 'jpeg' as const, extension: '.jpg', mimeTypes: ['image/jpeg', 'image/jpg'] },
  { kind: 'webp' as const, extension: '.webp', mimeTypes: ['image/webp'] },
] as const

export function getEmployerLogosPath(): string {
  // מחוץ ל-public כשאין אחסון חיצוני, כדי שהלוגו לא יהיה קובץ סטטי ציבורי.
  if (process.env.UPLOADS_PATH) {
    return join(getUploadsBasePath(), EMPLOYER_LOGOS_DIR)
  }
  return join(process.cwd(), 'private-uploads', EMPLOYER_LOGOS_DIR)
}

export function getEmployerLogoFormat(file: File) {
  const name = file.name.toLowerCase()
  const mime = file.type.toLowerCase()
  return LOGO_FORMATS.find((format) =>
    (name.endsWith(format.extension) || (format.kind === 'jpeg' && name.endsWith('.jpeg'))) &&
    format.mimeTypes.includes(mime)
  )
}

export function isValidEmployerLogoBytes(bytes: Buffer, kind: 'png' | 'jpeg' | 'webp'): boolean {
  return hasImageUploadSignature(bytes, kind)
}

export function websiteEmployerFields(employer?: {
  name: string
  email?: string | null
  phone?: string | null
  website?: string | null
  description?: string | null
} | null) {
  if (!employer) return undefined
  return {
    name: employer.name,
    email: employer.email || '',
    phone: employer.phone || '',
    website: employer.website || '',
    logo: '',
    description: employer.description || '',
  }
}
