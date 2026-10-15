import { z } from 'zod'

// בגרסת ה-SDK המותקנת timeout נמסר ל-getGenerativeModel, לא ל-generateContent.
export const MATCHING_PROVIDER_TIMEOUT_MS = 30_000

const objectSchema = z.record(z.string(), z.unknown())
const stringSchema = z.string()
const numberSchema = z.number().finite()
const booleanSchema = z.boolean()

export function matchingProviderObject(value: unknown): Record<string, unknown> {
  const result = objectSchema.safeParse(value)
  return result.success ? result.data : {}
}

export function parseMatchingProviderObject(text: string): Record<string, unknown> {
  try {
    const content = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    let parsed: unknown
    try {
      parsed = JSON.parse(content)
    } catch {
      // שימור תמיכה בטקסט הסבר לפני JSON, בלי לחלץ אובייקט מתוך מערך/JSON שבור.
      const match = content.match(/\{[\s\S]*\}/)
      if (!match || /^[\[{"\d-]/.test(content) || content.slice(0, match.index).includes('[')) {
        throw new Error('Invalid matching provider JSON')
      }
      parsed = JSON.parse(match[0])
    }
    return objectSchema.parse(parsed)
  } catch {
    // שגיאות JSON/Zod עלולות להכיל את תוכן התשובה; אין להעביר אותן הלאה.
    throw new Error('Invalid matching provider JSON')
  }
}

export function matchingProviderString(value: unknown, fallback = ''): string {
  const result = stringSchema.safeParse(value)
  return result.success && result.data.trim() ? result.data : fallback
}

export function matchingProviderStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  const result: string[] = []
  for (const item of value) {
    const text = matchingProviderString(item).trim()
    const key = text.toLowerCase()
    if (text && !seen.has(key)) {
      seen.add(key)
      result.push(text)
    }
  }
  return result
}

export function matchingProviderNumber(value: unknown, fallback = 0, minimum = 0, maximum = Infinity): number {
  const result = numberSchema.safeParse(value)
  return result.success ? Math.max(minimum, Math.min(maximum, result.data)) : fallback
}

export function matchingProviderBoolean(value: unknown, fallback = false): boolean {
  const result = booleanSchema.safeParse(value)
  return result.success ? result.data : fallback
}

export function matchingProviderEnum<T extends string>(value: unknown, choices: readonly T[], fallback: T): T {
  return choices.find(choice => choice === value) ?? fallback
}

// מזעור מידע בקריאות התאמה בלבד; קריאות שמחלצות פרטי קשר עדיין זקוקות למקור.
// הסרה מיטבית של פרטים ידועים ופורמטים נפוצים, לא הבטחה לאנונימיזציה מלאה של CV.
export function redactMatchingProviderInput(text: string, knownIdentifiers: unknown[] = []): string {
  let result = text
  for (const identifier of matchingProviderStrings(knownIdentifiers)) {
    if (identifier !== 'לא צוין' && identifier !== 'לא ידוע') {
      result = result.split(identifier).join('[REDACTED]')
    }
  }
  return result
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[EMAIL]')
    .replace(/(?<!\d)(?:\+972[ \t().-]*[1-9]|0[1-9])(?:[ \t().-]*\d){7,8}(?!\d)/g, '[PHONE]')
}