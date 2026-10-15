import { z } from 'zod'
import { authorizeMatchingRequest, enrichCandidateMatchScan, getCandidateMatchScan, matchingIdSchema, matchingJson, positionMatchResponse } from '@/lib/matching-api'
import { MATCHING_ENGINE_VERSION } from '@/lib/matching-engine'
import { TOTAL_LOCALITIES } from '@/lib/israel-locations'

const requestSchema = z.object({ candidateId: matchingIdSchema, positionId: matchingIdSchema.optional(), semantic: z.boolean().optional().default(false) })

// מסלול התאמה לקריאה בלבד: סריקה מלאה, ללא מינימום מלאכותי או מכסות מקצוע.
export async function POST(request: Request) {
  try {
    const authorization = await authorizeMatchingRequest()
    if ('response' in authorization) return authorization.response
    const start = Date.now()
    const parsed = requestSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return matchingJson({ error: 'מזהי מועמד ומשרה אינם תקינים', code: 'INVALID_INPUT' }, 400)
    const scan = await getCandidateMatchScan(parsed.data.candidateId, parsed.data.positionId)
    if (!scan) return matchingJson({ error: 'מועמד לא נמצא' }, 404)
    const semanticCoverage = parsed.data.semantic ? await enrichCandidateMatchScan(scan, authorization.user.id) : null
    if (parsed.data.positionId) {
      const item = scan.scored[0]
      return item ? matchingJson({ ...positionMatchResponse(item), semanticCoverage }) : matchingJson({ error: 'משרה פתוחה לא נמצאה' }, 404)
    }
    return matchingJson({
      matches: scan.suggested.map(positionMatchResponse),
      notRelevant: scan.totalScanned - scan.suggested.length,
      totalScanned: scan.totalScanned, aiAnalyzed: semanticCoverage?.reviewed ?? 0, scanComplete: true,
      scanTimeMs: Date.now() - start, candidateCity: scan.candidate.city || 'לא צוין',
      normalizedCity: scan.scored[0]?.match.location.candidateCity ?? scan.candidate.city ?? null,
      locationDatabase: TOTAL_LOCALITIES, engineVersion: MATCHING_ENGINE_VERSION,
      analysisMode: semanticCoverage?.reviewed ? 'local-and-semantic' : 'local-evidence', semanticCoverage,
      message: 'סריקת טקסט מלאה ומקומית. ציון עזר מבוסס ראיות, לא הסתברות קבלה לעבודה.',
    })
  } catch {
    console.error('[ai-match-v3] Matching failed')
    return matchingJson({ error: 'שגיאה בסריקת ההתאמות' }, 500)
  }
}


