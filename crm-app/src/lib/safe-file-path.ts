import path from 'node:path'

// לא מסתפקים ב-prefix: uploads-other אינו ילד של uploads.
export function isPathWithin(base: string, target: string): boolean {
  const relative = path.relative(path.resolve(base), path.resolve(target))
  return relative !== '' && relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative)
}

export function resolveUploadPath(base: string, segments: string[]): string | null {
  if (!segments.length || segments.some((segment) =>
    !segment || segment === '.' || segment === '..' || /[\\/:\u0000-\u001f\u007f]/.test(segment)
  )) return null
  const target = path.resolve(base, ...segments)
  return isPathWithin(base, target) ? target : null
}

export function inlineFileDisposition(filename: string): string {
  const encoded = encodeURIComponent(filename).replace(/['()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`)
  return `inline; filename="download"; filename*=UTF-8''${encoded}`
}