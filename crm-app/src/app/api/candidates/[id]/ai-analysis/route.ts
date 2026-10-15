import { z } from "zod"
import {
  authorizeMatchingRequest, enrichCandidateMatchScan, getCandidateMatchScan,
  matchingIdSchema, matchingJson, positionMatchResponse,
} from "@/lib/matching-api"

const requestSchema = z.object({ positionId: matchingIdSchema })

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// בקשת ניתוח מפורשת: קריאה בלבד, עם אותם ציונים, שערים וראיות של מסלולי ההתאמה.
export async function POST(
  request: Request,
  { params }: RouteParams
) {
  try {
    const authorization = await authorizeMatchingRequest()
    if ("response" in authorization) return authorization.response

    const candidateId = matchingIdSchema.safeParse((await params).id)
    if (!candidateId.success) return matchingJson({ error: "מזהה מועמד אינו תקין", code: "INVALID_INPUT" }, 400)
    const parsed = requestSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return matchingJson({ error: "מזהה משרה אינו תקין", code: "INVALID_INPUT" }, 400)

    const scan = await getCandidateMatchScan(candidateId.data, parsed.data.positionId)
    if (!scan) return matchingJson({ error: "מועמד לא נמצא" }, 404)
    const item = scan.scored[0]
    if (!item) return matchingJson({ error: "משרה פתוחה לא נמצאה" }, 404)

    // כשל ספק מטופל בשכבה המשותפת; אין כאן ניתוח או ניקוד חלופי עצמאי.
    const semanticCoverage = await enrichCandidateMatchScan(scan, authorization.user.id)
    const semanticStatus = semanticCoverage.requested === 0
      ? "לא בוצעה בדיקה סמנטית למשרה זו; ראו מגבלות התאמה ואיכות טקסט."
      : semanticCoverage.status === "complete"
        ? "הבדיקה הסמנטית הושלמה; משמעות הקישורים דורשת אימות אנושי."
        : semanticCoverage.status === "partial"
          ? "הבדיקה הסמנטית הושלמה חלקית; רק קישורים שעברו בדיקת מקור נשמרו ונדרש אימות אנושי."
          : "הבדיקה הסמנטית לא זמינה; מוצגות ראיות מקומיות בלבד."
    const aiInsights = [
      "הציון מבוסס על מנגנון ההתאמה המשותף וראיות; אינו הסתברות קבלה לעבודה.",
      semanticStatus,
      `כיסוי סמנטי: ${semanticCoverage.reviewed}/${semanticCoverage.requested} משרות; ${semanticCoverage.verifiedLinks} קישורי ראיות אומתו מול המקור.`,
    ].join(" ")

    return matchingJson({
      ...positionMatchResponse(item),
      candidateName: scan.candidate.name,
      positionTitle: item.position.title,
      employerName: item.position.employer.name,
      workedAtCompanyBefore: item.blockedByPreviousEmployer,
      aiInsights,
      insights: aiInsights,
      semanticCoverage,
      analysisMode: semanticCoverage.reviewed ? "local-and-semantic" : "local-evidence",
    })
  } catch {
    console.error("[ai-analysis] Matching failed")
    return matchingJson({ error: "שגיאה בניתוח ההתאמה" }, 500)
  }
}
