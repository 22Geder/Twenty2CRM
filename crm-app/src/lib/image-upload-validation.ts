import path from 'path'

export const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024
export const MAX_IMAGE_UPLOAD_FILES = 10

export type ImageUploadType = 'facebook' | 'email' | 'general'
type FileKind = 'jpeg' | 'png' | 'gif' | 'webp' | 'pdf' | 'doc' | 'docx'
type UploadFormat = { kind: FileKind; extension: string; mimeTypes: readonly string[] }

const formats: UploadFormat[] = [
  { kind: 'jpeg', extension: '.jpg', mimeTypes: ['image/jpeg', 'image/jpg'] },
  { kind: 'png', extension: '.png', mimeTypes: ['image/png'] },
  { kind: 'gif', extension: '.gif', mimeTypes: ['image/gif'] },
  { kind: 'webp', extension: '.webp', mimeTypes: ['image/webp'] },
  { kind: 'pdf', extension: '.pdf', mimeTypes: ['application/pdf'] },
  { kind: 'doc', extension: '.doc', mimeTypes: ['application/msword'] },
  { kind: 'docx', extension: '.docx', mimeTypes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'] },
]

export function getImageUploadFormat(file: File, uploadType: ImageUploadType): UploadFormat | undefined {
  const extension = path.extname(file.name).toLowerCase()
  return formats.find(format =>
    (format.extension === extension || (format.kind === 'jpeg' && extension === '.jpeg')) &&
    format.mimeTypes.includes(file.type.toLowerCase()) &&
    (uploadType !== 'facebook' || format.mimeTypes[0].startsWith('image/')),
  )
}

// שמות שנוצרו כאן או בפורמט הישן בלבד; אין נתיבים, קידוד כפול או שמות התקן של Windows.
export function isImageUploadBasename(filename: string): boolean {
  return filename.length > 0 && filename.length <= 255 &&
    !/[^a-zA-Z0-9\u05D0-\u05EA._-]/.test(filename) &&
    !filename.startsWith('.') && !filename.endsWith('.') &&
    !/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(filename) &&
    path.posix.basename(filename) === filename && path.win32.basename(filename) === filename
}

// זיהוי DOCX לפי רשומות ZIP אמיתיות, לא רק PK או טקסט שמתחזה לשם רשומה.
// אין חילוץ או פריסה של תוכן הארכיון, כדי לא להפעיל קוד או לנפח ZIP עוין בזיכרון.
function hasDocxDirectory(bytes: Buffer): boolean {
  if (bytes.length < 22 || bytes.readUInt32LE(0) !== 0x04034b50) return false

  let end = bytes.length - 22
  const earliestEnd = Math.max(0, end - 0xffff)
  for (; end >= earliestEnd; end--) {
    if (bytes.readUInt32LE(end) === 0x06054b50 && end + 22 + bytes.readUInt16LE(end + 20) === bytes.length) break
  }
  if (end < earliestEnd) return false

  const count = bytes.readUInt16LE(end + 10)
  const directorySize = bytes.readUInt32LE(end + 12)
  let cursor = bytes.readUInt32LE(end + 16)
  if (!count || bytes.readUInt16LE(end + 4) !== 0 || bytes.readUInt16LE(end + 6) !== 0 ||
      bytes.readUInt16LE(end + 8) !== count || cursor + directorySize !== end) return false

  const directoryStart = cursor
  const required = new Set(['[Content_Types].xml', 'word/document.xml'])
  for (let index = 0; index < count; index++) {
    if (cursor + 46 > end || bytes.readUInt32LE(cursor) !== 0x02014b50) return false
    const nameLength = bytes.readUInt16LE(cursor + 28)
    const entryEnd = cursor + 46 + nameLength + bytes.readUInt16LE(cursor + 30) + bytes.readUInt16LE(cursor + 32)
    const local = bytes.readUInt32LE(cursor + 42)
    const compressedSize = bytes.readUInt32LE(cursor + 20)
    if (entryEnd > end || (bytes.readUInt16LE(cursor + 8) & 1) !== 0 ||
        bytes.readUInt16LE(cursor + 34) !== 0 || local + 30 > directoryStart ||
        bytes.readUInt32LE(local) !== 0x04034b50) return false

    const localNameLength = bytes.readUInt16LE(local + 26)
    const localNameEnd = local + 30 + localNameLength
    if (localNameEnd + bytes.readUInt16LE(local + 28) + compressedSize > directoryStart ||
        localNameLength !== nameLength ||
        !bytes.subarray(local + 30, localNameEnd).equals(bytes.subarray(cursor + 46, cursor + 46 + nameLength))) return false

    required.delete(bytes.toString('utf8', cursor + 46, cursor + 46 + nameLength))
    cursor = entryEnd
  }
  return cursor === end && required.size === 0
}

// MIME וסיומת אינם הוכחה לתוכן. בודקים חתימה ומבנה בסיסי לפני שמירה ציבורית.
export function hasImageUploadSignature(bytes: Buffer, kind: FileKind): boolean {
  switch (kind) {
    case 'jpeg':
      return bytes.length >= 4 && bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])) &&
        bytes.subarray(-2).equals(Buffer.from([0xff, 0xd9]))
    case 'png':
      return bytes.length >= 33 && bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')) &&
        bytes.readUInt32BE(8) === 13 && bytes.toString('latin1', 12, 16) === 'IHDR'
    case 'gif':
      return bytes.length >= 14 && ['GIF87a', 'GIF89a'].includes(bytes.toString('latin1', 0, 6)) &&
        bytes[bytes.length - 1] === 0x3b
    case 'webp':
      return bytes.length >= 20 && bytes.toString('latin1', 0, 4) === 'RIFF' &&
        bytes.readUInt32LE(4) === bytes.length - 8 && bytes.toString('latin1', 8, 12) === 'WEBP' &&
        ['VP8 ', 'VP8L', 'VP8X'].includes(bytes.toString('latin1', 12, 16))
    case 'pdf':
      return /^%PDF-(1\.[0-7]|2\.0)[\r\n]/.test(bytes.toString('latin1', 0, 9)) &&
        bytes.subarray(-1024).includes(Buffer.from('%%EOF'))
    case 'doc':
      return bytes.length >= 512 && bytes.subarray(0, 8).equals(Buffer.from('d0cf11e0a1b11ae1', 'hex')) &&
        bytes.includes(Buffer.from('WordDocument\0', 'utf16le'))
    case 'docx':
      return hasDocxDirectory(bytes)
  }
}