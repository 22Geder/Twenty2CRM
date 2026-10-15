import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authorizeMatchingRequest, matchingIdSchema, matchingJson, matchingPositionSelect, scanMatchingCandidates } from '@/lib/matching-api'

interface RouteParams {
  params: Promise<{ id: string }>
}

// כל המועמדים נסרקים בעמודים של 50. הגבלת התצוגה אינה הגבלת הסריקה.
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authorization = await authorizeMatchingRequest()
    if ('response' in authorization) return authorization.response
    const id = matchingIdSchema.safeParse((await params).id)
    const query = new URL(request.url).searchParams
    const page = z.object({ offset: z.coerce.number().int().min(0).max(100000), limit: z.coerce.number().int().min(1).max(100) })
      .safeParse({ offset: query.get('offset') ?? 0, limit: query.get('limit') ?? 100 })
    if (!id.success || !page.success) return matchingJson({ error: 'בקשת התאמה לא תקינה' }, 400)
    const position = await prisma.position.findUnique({ where: { id: id.data }, select: matchingPositionSelect })
    if (!position) return matchingJson({ error: 'משרה לא נמצאה' }, 404)
    const result = await scanMatchingCandidates(position, id.data, page.data.offset, page.data.limit)
    return matchingJson({ ...result, positionTags: position.tags, positionCategories: [] })
  } catch {
    console.error('[matching-candidates] Matching failed')
    return matchingJson({ error: 'שגיאה בחיפוש מועמדים' }, 500)
  }
}
