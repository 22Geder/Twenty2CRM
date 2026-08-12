import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { syncPositionToWebsite } from "@/lib/twenty2jobs-sync"

function generateKeywords(input: string, max = 30): string[] {
  const stopwords = new Set([
    'של', 'עם', 'על', 'אל', 'את', 'הוא', 'היא', 'זה', 'זו', 'גם', 'או', 'אם', 'כי',
    'אבל', 'ניסיון', 'שנים', 'שנה', 'תפקיד', 'עבודה', 'משרה', 'דרישות', 'אחריות',
    'יתרון', 'חובה', 'כולל', 'כוללת', 'and', 'or', 'the', 'a', 'an', 'to', 'in',
    'for', 'with', 'on', 'of', 'experience', 'years', 'requirements',
  ])

  const tokens = (input || "")
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .map(t => t.trim())
    .filter(t => t.length >= 3 && !stopwords.has(t))

  const counts = new Map<string, number>()
  for (const tok of tokens) counts.set(tok, (counts.get(tok) || 0) + 1)

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([t]) => t)
    .slice(0, max)
}

interface JobToSave {
  title: string
  location?: string
  description?: string
  requirements?: string
  employmentType?: string
  salaryRange?: string
  tags?: string[]
  openings?: number
  employerId: string
  recruiterId?: string
  active?: boolean
}

// ═══════════════════════════════════════════════════════
//  POST /api/positions/bulk-save
//  מקבל מערך של משרות ושומר הכל ל-DB
// ═══════════════════════════════════════════════════════
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { jobs, employerId, recruiterId, active = false } = body

    if (!Array.isArray(jobs) || jobs.length === 0) {
      return NextResponse.json({ error: "יש לספק מערך משרות" }, { status: 400 })
    }

    if (jobs.length > 50) {
      return NextResponse.json({ error: "מקסימום 50 משרות בפעם אחת" }, { status: 400 })
    }

    if (!employerId) {
      return NextResponse.json({ error: "חובה לבחור מעסיק" }, { status: 400 })
    }

    // וודא שהמעסיק קיים
    const employer = await prisma.employer.findUnique({ where: { id: employerId } })
    if (!employer) {
      return NextResponse.json({ error: "המעסיק לא נמצא" }, { status: 404 })
    }

    // שמור כל משרה + תגיות
    const results: { id: string; title: string; status: "saved" | "error"; error?: string }[] = []

    for (const job of jobs as JobToSave[]) {
      try {
        if (!job.title?.trim()) {
          results.push({ id: "", title: job.title || "(ללא שם)", status: "error", error: "חסר שם משרה" })
          continue
        }

        const fullText = [job.title, job.description, job.requirements].filter(Boolean).join(" ")
        const keywords = generateKeywords(fullText)

        // מצא או צור תגיות
        const tagConnects: { id: string }[] = []
        if (job.tags && job.tags.length > 0) {
          for (const tagName of job.tags.slice(0, 10)) {
            const cleanTag = tagName.trim().slice(0, 50)
            if (!cleanTag) continue
            try {
              const tag = await prisma.tag.upsert({
                where: { name: cleanTag },
                update: {},
                create: { name: cleanTag, type: "SKILL" },
              })
              tagConnects.push({ id: tag.id })
            } catch {
              // אם upsert נכשל, המשך
            }
          }
        }

        const position = await prisma.position.create({
          data: {
            title: job.title.trim(),
            description: job.description?.trim() || null,
            requirements: job.requirements?.trim() || null,
            location: job.location?.trim() || null,
            salaryRange: job.salaryRange?.trim() || null,
            employmentType: job.employmentType || null,
            keywords: keywords.length ? JSON.stringify(keywords) : null,
            employerId,
            recruiterId: recruiterId || null,
            active: active ?? false,
            openings: typeof job.openings === "number" && job.openings > 0 ? job.openings : 1,
            tags: tagConnects.length > 0 ? { connect: tagConnects } : undefined,
          },
        })

        // סנכרון לאתר אם פעיל
        if (process.env.TWENTY2JOBS_AUTO_SYNC === "true" && position.active) {
          syncPositionToWebsite(position.id).catch(err =>
            console.log("Sync warning:", err.message)
          )
        }

        results.push({ id: position.id, title: position.title, status: "saved" })
      } catch (err) {
        console.error("Error saving job:", job.title, err)
        results.push({
          id: "",
          title: job.title || "(ללא שם)",
          status: "error",
          error: err instanceof Error ? err.message : "שגיאה לא ידועה",
        })
      }
    }

    const saved = results.filter(r => r.status === "saved").length
    const failed = results.filter(r => r.status === "error").length

    return NextResponse.json({
      success: true,
      saved,
      failed,
      results,
    })
  } catch (error) {
    console.error("bulk-save error:", error)
    return NextResponse.json({ error: "שגיאה בשמירת המשרות" }, { status: 500 })
  }
}
