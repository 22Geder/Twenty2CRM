import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getAllPositiveKeywords, findMatchingTags } from '@/lib/recruitment-tags'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * אופטימיזציית מילות מפתח (keywords) למשרות — בדיוק 18 לכל משרה.
 *
 * פעולות (POST body: { action, secret, ... }):
 *   - "backup"   : מחזיר את כל המשרות עם ה-keywords הנוכחיים (לגיבוי). קריאה בלבד.
 *   - "generate" : מייצר בעזרת Gemini בדיוק 18 keywords לכל משרה. ללא כתיבה ל-DB.
 *   - "apply"    : מקבל proposals ומעדכן keywords בלבד (מאמת 18 ייחודיות).
 *   - "verify"   : סופר keywords לכל משרה ומחזיר את אלו שאינן 18.
 *
 * אבטחה: חובה secret התואם ל-KEYWORDS_ADMIN_SECRET או NEXTAUTH_SECRET.
 * לא נוגעים בכותרת/תיאור/דרישות — רק בשדה keywords.
 */

const TARGET = 18

function checkSecret(secret: unknown): boolean {
  const expected = process.env.KEYWORDS_ADMIN_SECRET || process.env.NEXTAUTH_SECRET || ''
  if (!expected) return false
  return typeof secret === 'string' && secret.length > 0 && secret === expected
}

function parseKeywords(raw: string | null | undefined): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed.map((k) => String(k))
  } catch {
    // fallback: פסיקים / שורות
    return String(raw)
      .split(/[,\n]+/)
      .map((k) => k.trim())
      .filter(Boolean)
  }
  return []
}

/** ניקוי + הסרת כפילויות (case/רווחים) תוך שמירת סדר */
function dedupe(list: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const item of list) {
    const clean = String(item || '').trim().replace(/\s+/g, ' ')
    if (!clean) continue
    const key = clean.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(clean)
  }
  return out
}

/**
 * מבטיח בדיוק 18 keywords ייחודיות.
 * חוסר -> משלים ממילון המערכת (findMatchingTags) לפי טקסט המשרה, ואז מטוקנים בכותרת/דרישות.
 * עודף -> חותך ל-18 הראשונות.
 */
function ensureExactly18(candidate: string[], text: string): string[] {
  const list = dedupe(candidate)

  if (list.length < TARGET) {
    const have = new Set(list.map((k) => k.toLowerCase()))
    const canonical = findMatchingTags(text, 40).map((m) => m.keyword)
    for (const kw of canonical) {
      if (list.length >= TARGET) break
      if (!have.has(kw.toLowerCase())) {
        list.push(kw)
        have.add(kw.toLowerCase())
      }
    }
    if (list.length < TARGET) {
      const tokens = text
        .split(/[\s,.\-\/()"'\[\]]+/)
        .map((t) => t.trim())
        .filter((t) => t.length > 2)
      for (const t of tokens) {
        if (list.length >= TARGET) break
        if (!have.has(t.toLowerCase())) {
          list.push(t)
          have.add(t.toLowerCase())
        }
      }
    }
  }

  return list.slice(0, TARGET)
}

function positionText(p: {
  title?: string | null
  description?: string | null
  requirements?: string | null
  location?: string | null
  employmentType?: string | null
  employer?: { name?: string | null } | null
}): string {
  return [
    p.title,
    p.employer?.name,
    p.location,
    p.employmentType,
    p.description,
    p.requirements,
  ]
    .filter(Boolean)
    .join(' \n ')
}

async function generateForPosition(
  model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>,
  p: any,
  vocabHint: string
): Promise<{ keywords: string[]; error?: string }> {
  const text = positionText(p)
  const current = parseKeywords(p.keywords)

  const prompt = `אתה מומחה גיוס ותיוג משרות. עליך להפיק **בדיוק 18 מילות מפתח (תגיות)** בעברית עבור המשרה הבאה, כדי שמנוע ההתאמה (AI) יזהה נכון מועמדים מתאימים — בלי עומס ובלי תגיות מבלבלות.

כותרת: ${p.title || 'לא צוין'}
מעסיק: ${p.employer?.name || 'לא צוין'}
מיקום: ${p.location || 'לא צוין'}
סוג משרה: ${p.employmentType || 'לא צוין'}
תיאור: ${p.description || 'לא צוין'}
דרישות: ${p.requirements || 'לא צוין'}

מילות מפתח נוכחיות (לעיון בלבד, אפשר לשפר/להחליף): ${current.join(', ') || 'אין'}

מילון תגיות קנוני מהמערכת (העדף להשתמש במונחים משם כשהם רלוונטיים, לזיהוי טוב יותר של ה-AI):
${vocabHint}

חוקים מחייבים:
1. בדיוק 18 פריטים — לא פחות, לא יותר.
2. עברית בלבד (מותר מונח מקצועי לועזי מקובל כמו "WMS", "ERP", "B2B").
3. ייחודיות מלאה — בלי כפילויות ובלי מילים נרדפות כמעט־זהות.
4. רלוונטיות מדויקת למשרה הזו: תחום, תפקיד, כישורים, כלים, מיקום/אזור, סוג העסקה.
5. מונחים קצרים וברורים (1-3 מילים כל אחד). בלי משפטים, בלי תיאורים.
6. אל תמציא דרישות שלא קיימות במשרה.

החזר JSON תקין בלבד במבנה: {"keywords": ["...", "..."]} עם בדיוק 18 מחרוזות. ללא טקסט נוסף.`

  try {
    const result = await model.generateContent(prompt)
    const raw = result.response.text()
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    let arr: string[] = []
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0])
        if (Array.isArray(parsed.keywords)) arr = parsed.keywords.map((k: any) => String(k))
      } catch {
        const arrMatch = raw.match(/\[[\s\S]*\]/)
        if (arrMatch) {
          try {
            const parsedArr = JSON.parse(arrMatch[0])
            if (Array.isArray(parsedArr)) arr = parsedArr.map((k: any) => String(k))
          } catch {
            /* ignore */
          }
        }
      }
    }
    const keywords = ensureExactly18(arr, text)
    return { keywords }
  } catch (err) {
    // כשל AI — ניפול חזרה על ה-keywords הקיימים + מילון המערכת כדי לא לחסום
    const keywords = ensureExactly18(current, text)
    return { keywords, error: String(err) }
  }
}

export async function GET() {
  return NextResponse.json({
    name: 'optimize-keywords',
    target: TARGET,
    actions: ['backup', 'generate', 'apply', 'verify'],
    usage: 'POST { action, secret, ... }',
  })
}

export async function POST(request: NextRequest) {
  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { action, secret } = body || {}

  if (!checkSecret(secret)) {
    return NextResponse.json({ error: 'Unauthorized (secret שגוי או חסר)' }, { status: 401 })
  }

  try {
    // ============ BACKUP ============
    if (action === 'backup') {
      const positions = await prisma.position.findMany({
        select: {
          id: true,
          title: true,
          keywords: true,
          active: true,
          employer: { select: { name: true } },
        },
        orderBy: { createdAt: 'asc' },
      })
      const data = positions.map((p) => ({
        id: p.id,
        title: p.title,
        employer: p.employer?.name || null,
        active: p.active,
        keywordCount: parseKeywords(p.keywords).length,
        keywords: parseKeywords(p.keywords),
      }))
      return NextResponse.json({
        success: true,
        action: 'backup',
        total: data.length,
        timestamp: new Date().toISOString(),
        positions: data,
      })
    }

    // ============ VERIFY ============
    if (action === 'verify') {
      const positions = await prisma.position.findMany({
        select: {
          id: true,
          title: true,
          keywords: true,
          employer: { select: { name: true } },
        },
        orderBy: { createdAt: 'asc' },
      })
      const counts = positions.map((p) => ({
        id: p.id,
        title: p.title,
        employer: p.employer?.name || null,
        count: parseKeywords(p.keywords).length,
      }))
      const notExact = counts.filter((c) => c.count !== TARGET)
      return NextResponse.json({
        success: true,
        action: 'verify',
        total: counts.length,
        exact18: counts.length - notExact.length,
        notExact18Count: notExact.length,
        notExact18: notExact,
        allDone: notExact.length === 0,
      })
    }

    // ============ GENERATE ============
    if (action === 'generate') {
      const apiKey = process.env.GEMINI_API_KEY
      if (!apiKey) {
        return NextResponse.json({ error: 'GEMINI_API_KEY חסר בסביבה' }, { status: 500 })
      }

      const limit = Math.min(Math.max(parseInt(String(body.limit ?? '25'), 10) || 25, 1), 100)
      const offset = Math.max(parseInt(String(body.offset ?? '0'), 10) || 0, 0)
      const employerId: string | undefined = body.employerId || undefined
      const activeOnly: boolean = body.activeOnly === true

      const where: any = {}
      if (employerId) where.employerId = employerId
      if (activeOnly) where.active = true

      const positions = await prisma.position.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          requirements: true,
          location: true,
          employmentType: true,
          keywords: true,
          employer: { select: { name: true } },
        },
        orderBy: { createdAt: 'asc' },
        skip: offset,
        take: limit,
      })

      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      })
      const vocabHint = getAllPositiveKeywords().slice(0, 220).join(', ')

      const proposals: Array<{
        id: string
        title: string
        employer: string | null
        currentCount: number
        keywords: string[]
        count: number
        error?: string
      }> = []

      for (const p of positions) {
        const { keywords, error } = await generateForPosition(model, p, vocabHint)
        proposals.push({
          id: p.id,
          title: p.title,
          employer: p.employer?.name || null,
          currentCount: parseKeywords(p.keywords).length,
          keywords,
          count: keywords.length,
          ...(error ? { error } : {}),
        })
        // הפוגה קטנה כדי לא לחרוג ממגבלת קצב
        await new Promise((r) => setTimeout(r, 350))
      }

      const totalMatching = await prisma.position.count({ where })

      return NextResponse.json({
        success: true,
        action: 'generate',
        offset,
        limit,
        returned: proposals.length,
        totalMatching,
        nextOffset: offset + proposals.length,
        hasMore: offset + proposals.length < totalMatching,
        allExactly18: proposals.every((p) => p.count === TARGET),
        proposals,
      })
    }

    // ============ APPLY ============
    if (action === 'apply') {
      if (body.confirm !== 'APPLY') {
        return NextResponse.json(
          { error: 'נדרש confirm:"APPLY" כדי לכתוב לבסיס הנתונים' },
          { status: 400 }
        )
      }
      const proposals: Array<{ id: string; keywords: string[] }> = body.proposals
      if (!Array.isArray(proposals) || proposals.length === 0) {
        return NextResponse.json({ error: 'proposals ריק או לא תקין' }, { status: 400 })
      }

      // אימות מקדים — כל המשרות חייבות בדיוק 18 ייחודיות
      const invalid: Array<{ id: string; count: number }> = []
      for (const pr of proposals) {
        const clean = dedupe(pr.keywords || [])
        if (clean.length !== TARGET) invalid.push({ id: pr.id, count: clean.length })
      }
      if (invalid.length > 0) {
        return NextResponse.json(
          { error: 'לא כל ההצעות מכילות בדיוק 18 keywords ייחודיות', invalid },
          { status: 400 }
        )
      }

      const updated: Array<{ id: string; title: string; oldKeywords: string[]; newCount: number }> = []
      for (const pr of proposals) {
        const clean = dedupe(pr.keywords)
        const existing = await prisma.position.findUnique({
          where: { id: pr.id },
          select: { id: true, title: true, keywords: true },
        })
        if (!existing) continue
        await prisma.position.update({
          where: { id: pr.id },
          data: { keywords: JSON.stringify(clean) },
        })
        updated.push({
          id: existing.id,
          title: existing.title,
          oldKeywords: parseKeywords(existing.keywords),
          newCount: clean.length,
        })
      }

      return NextResponse.json({
        success: true,
        action: 'apply',
        updated: updated.length,
        positions: updated,
      })
    }

    return NextResponse.json({ error: `פעולה לא מוכרת: ${action}` }, { status: 400 })
  } catch (error) {
    console.error('optimize-keywords error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
