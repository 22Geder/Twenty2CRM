import { NextRequest } from 'next/server'
import { z } from 'zod'
import { authorizeMatchingRequest, getCandidateMatchScan, matchingIdSchema, matchingJson, positionMatchResponse } from '@/lib/matching-api'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET /api/candidates/[id]/matching-positions - מציאת משרות מתאימות למועמד
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const authorization = await authorizeMatchingRequest()
    if ('response' in authorization) return authorization.response
    const id = matchingIdSchema.safeParse((await params).id)
    const query = new URL(request.url).searchParams
    const page = z.object({ offset: z.coerce.number().int().min(0).max(100000), limit: z.coerce.number().int().min(1).max(100) })
      .safeParse({ offset: query.get('offset') ?? 0, limit: query.get('limit') ?? 20 })
    if (!id.success || !page.success) return matchingJson({ error: 'בקשת התאמה לא תקינה' }, 400)
    const scan = await getCandidateMatchScan(id.data)
    if (!scan) return matchingJson({ error: 'מועמד לא נמצא' }, 404)
    const { offset, limit } = page.data
    return matchingJson({
      positions: scan.suggested.slice(offset, offset + limit).map(positionMatchResponse),
      candidateTags: scan.candidate.tags, totalCount: scan.suggested.length,
      totalScanned: scan.totalScanned, scanComplete: true,
      previousCompanies: scan.candidate.currentCompany ? [scan.candidate.currentCompany] : [],
      offset, limit, hasMore: offset + limit < scan.suggested.length,
    })
  } catch {
    console.error('[matching-positions] Matching failed')
    return matchingJson({ error: 'שגיאה בחיפוש התאמות' }, 500)
  }
}
