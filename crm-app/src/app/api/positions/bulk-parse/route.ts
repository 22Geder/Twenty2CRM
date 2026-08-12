import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

// ═══════════════════════════════════════════════════════
//  POST /api/positions/bulk-parse
//  מקבל טקסט עם עד 50 משרות → מחזיר מערך של משרות מנותחות
// ═══════════════════════════════════════════════════════
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { text } = body

    if (!text || typeof text !== "string" || text.trim().length < 10) {
      return NextResponse.json({ error: "יש לספק טקסט עם תיאורי משרות" }, { status: 400 })
    }

    if (text.length > 200_000) {
      return NextResponse.json({ error: "הטקסט ארוך מדי (מקסימום 200,000 תווים)" }, { status: 400 })
    }

    // ── פיצול הטקסט לפי מפרידים נפוצים ──────────────────────
    const rawBlocks = splitIntoJobBlocks(text)

    if (rawBlocks.length === 0) {
      return NextResponse.json({ error: "לא נמצאו משרות בטקסט" }, { status: 400 })
    }

    if (rawBlocks.length > 50) {
      return NextResponse.json({ error: "מקסימום 50 משרות בפעם אחת" }, { status: 400 })
    }

    // ── שליחה ל-Gemini בקבוצות של 10 (rate limit) ────────────
    const BATCH_SIZE = 10
    const allJobs: ParsedJob[] = []

    for (let i = 0; i < rawBlocks.length; i += BATCH_SIZE) {
      const batch = rawBlocks.slice(i, i + BATCH_SIZE)
      const parsed = await parseBatchWithGemini(batch)
      allJobs.push(...parsed)

      // המתנה קצרה בין קבוצות
      if (i + BATCH_SIZE < rawBlocks.length) {
        await new Promise(r => setTimeout(r, 800))
      }
    }

    return NextResponse.json({
      success: true,
      total: allJobs.length,
      jobs: allJobs,
    })
  } catch (error) {
    console.error("bulk-parse error:", error)
    return NextResponse.json(
      { error: "שגיאה בניתוח המשרות" },
      { status: 500 }
    )
  }
}

// ─────────────────────────────────────────────────────────
//  פיצול הטקסט לבלוקים נפרדים לפי מפרידים נפוצים
// ─────────────────────────────────────────────────────────
function splitIntoJobBlocks(text: string): string[] {
  // מפרידים נפוצים: ---, ===, ###, משרה N, Job N, מספר מפריד
  const separatorPattern = /(?:^|\n)(?:---+|===+|###|_{3,}|\*{3,}|~~~+|(?:משרה|job|position)\s*\d+\.?\s*[-:]?)/gim

  let blocks: string[]

  const matches = [...text.matchAll(separatorPattern)]
  if (matches.length >= 1) {
    // יש מפרידים - פצל לפיהם
    blocks = text.split(separatorPattern).map(b => b.trim()).filter(b => b.length > 20)
  } else {
    // אין מפרידים - ננסה לזהות לפי שורה ריקה כפולה + כותרת
    blocks = text.split(/\n{2,}/).map(b => b.trim()).filter(b => b.length > 20)
  }

  // הגבל ל-50
  return blocks.slice(0, 50)
}

// ─────────────────────────────────────────────────────────
//  ניתוח קבוצת משרות עם Gemini
// ─────────────────────────────────────────────────────────
export interface ParsedJob {
  title: string
  location: string
  description: string
  requirements: string
  employmentType: string      // "משרה מלאה" | "משרה חלקית" | "חוזה" | "זמני"
  salaryRange: string
  tags: string[]              // עד 10 תגיות
  openings: number
  originalText: string        // הטקסט המקורי
  confidence: number          // 0-100
}

async function parseBatchWithGemini(blocks: string[]): Promise<ParsedJob[]> {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

  const prompt = `אתה מומחה ניתוח משרות. נתח את המשרות הבאות והחזר JSON בלבד.

עבור כל משרה חלץ:
- title: שם המשרה (קצר וברור)
- location: מיקום (עיר/אזור בלבד, ללא כתובת מלאה)
- description: תיאור התפקיד (עד 500 תווים)
- requirements: דרישות (עד 500 תווים, אם לא קיים - מחרוזת ריקה)
- employmentType: "משרה מלאה" / "משרה חלקית" / "חוזה" / "זמני" / "לא צוין"
- salaryRange: טווח שכר כמחרוזת (אם קיים, אחרת "")
- tags: מערך עד 10 תגיות קצרות ורלוונטיות (כישורים, תחום, מאפיינים)
- openings: מספר משרות פנויות (ברירת מחדל 1)
- confidence: ציון בטחון 0-100 לאיכות החילוץ

חוקים:
1. החזר JSON בלבד - ללא markdown, ללא הסברים
2. המערך יכיל בדיוק ${blocks.length} אובייקטים (אחד לכל משרה)
3. אם משרה לא ברורה, תן confidence נמוך אבל נסה בכל זאת
4. tags: קצרות (1-3 מילים), ממוקדות בתחום וכישורים

משרות לניתוח (ממוספרות):
${blocks.map((b, i) => `[משרה ${i + 1}]:\n${b}`).join("\n\n")}

החזר מערך JSON בפורמט:
[{"title":"...","location":"...","description":"...","requirements":"...","employmentType":"...","salaryRange":"...","tags":["..."],"openings":1,"confidence":85}, ...]`

  const result = await model.generateContent(prompt)
  const responseText = result.response.text().trim()

  // נקה markdown אם יש
  const cleaned = responseText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim()

  let parsed: any[]
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    // ניסיון שני - חפש מערך JSON בתוך הטקסט
    const match = cleaned.match(/\[[\s\S]*\]/)
    if (!match) {
      console.error("Gemini returned non-JSON:", cleaned.slice(0, 300))
      // החזר placeholders לכל בלוק
      return blocks.map((b, i) => createFallbackJob(b, i))
    }
    parsed = JSON.parse(match[0])
  }

  // וודא שמספר האובייקטים תואם
  return blocks.map((block, i) => {
    const item = parsed[i] || {}
    return {
      title: sanitize(item.title) || `משרה ${i + 1}`,
      location: sanitize(item.location) || "",
      description: sanitize(item.description) || "",
      requirements: sanitize(item.requirements) || "",
      employmentType: sanitize(item.employmentType) || "לא צוין",
      salaryRange: sanitize(item.salaryRange) || "",
      tags: Array.isArray(item.tags)
        ? item.tags.slice(0, 10).map((t: any) => sanitize(String(t))).filter(Boolean)
        : [],
      openings: typeof item.openings === "number" && item.openings > 0 ? item.openings : 1,
      originalText: block,
      confidence: typeof item.confidence === "number" ? Math.min(100, Math.max(0, item.confidence)) : 50,
    }
  })
}

function createFallbackJob(text: string, index: number): ParsedJob {
  // חילוץ בסיסי ללא AI
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean)
  return {
    title: lines[0]?.slice(0, 80) || `משרה ${index + 1}`,
    location: "",
    description: text.slice(0, 500),
    requirements: "",
    employmentType: "לא צוין",
    salaryRange: "",
    tags: [],
    openings: 1,
    originalText: text,
    confidence: 20,
  }
}

function sanitize(value: string): string {
  if (!value || typeof value !== "string") return ""
  // מניעת XSS בסיסי - הסרת תגי HTML
  return value.replace(/<[^>]*>/g, "").trim().slice(0, 2000)
}
