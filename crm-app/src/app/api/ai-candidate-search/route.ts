import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authorizeMatchingRequest, matchingIdSchema, matchingJson, matchingPositionSelect, scanMatchingCandidates } from '@/lib/matching-api'
import { extractMentionedCities } from '@/lib/matching-location'
import type { MatchingPosition } from '@/lib/matching-engine'

/**
 * חיפוש מועמדים על מנוע הראיות המשותף (אותו מנוע כמו קריאת קורות החיים).
 * אין ציון מספק AI; מיקום לפי רדיוס אווירי אחיד; כל המועמדים נסרקים.
 */
const bodySchema = z.object({
  query: z.string().trim().min(3).max(300),
  city: z.string().trim().max(80).optional(),
  cities: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
  tags: z.array(z.string().trim().min(1).max(80)).max(30).optional(),
  positionId: matchingIdSchema.optional(),
  minExperience: z.coerce.number().min(0).max(60).optional(),
  maxExperience: z.coerce.number().min(0).max(60).optional(),
  employmentType: z.string().trim().max(60).optional(),
  skillsFilter: z.string().trim().max(300).optional(),
  offset: z.coerce.number().int().min(0).max(100000).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const authorization = await authorizeMatchingRequest()
    if ('response' in authorization) return authorization.response
    const parsed = bodySchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return matchingJson({ error: 'נא להזין שאילתת חיפוש תקינה' }, 400)
    const body = parsed.data
    const startedAt = Date.now()

    const selectedCities = (body.cities?.length ? body.cities : body.city ? [body.city] : []).filter(Boolean)
    const searchCities = selectedCities.length ? selectedCities : extractMentionedCities(body.query)

    let position: MatchingPosition
    let positionId = ''
    if (body.positionId) {
      const stored = await prisma.position.findUnique({ where: { id: body.positionId }, select: matchingPositionSelect })
      if (!stored) return matchingJson({ error: 'משרה לא נמצאה' }, 404)
      positionId = stored.id
      position = { ...stored, location: selectedCities.length ? selectedCities.join(', ') : stored.location }
    } else {
      position = {
        title: body.query,
        location: searchCities.join(', ') || null,
        requirements: body.skillsFilter || null,
        keywords: body.tags ?? [],
        active: true,
        closedAt: null,
      }
    }

    const result = await scanMatchingCandidates(position, positionId, body.offset ?? 0, body.limit ?? 100, {
      minExperience: body.minExperience,
      maxExperience: body.maxExperience,
      tagNames: body.tags,
    })

    const results = result.candidates.map(candidate => ({
      ...candidate,
      cityMatch: candidate.locationMatch,
      cityProximity: candidate.locationMatchType === 'exact' ? 'exact'
        : candidate.locationMatch ? 'nearby'
          : candidate.locationMatchType === 'unknown' || candidate.locationMatchType === 'region' ? 'unknown' : 'none',
      matchReason: candidate.recommendation,
      highlights: candidate.strengths,
    }))

    return matchingJson({
      results,
      total: result.totalScanned,
      found: result.totalCount,
      offset: result.offset,
      limit: result.limit,
      hasMore: result.hasMore,
      radiusKm: result.radiusKm,
      engineVersion: result.engineVersion,
      searchTimeMs: Date.now() - startedAt,
      parsedCity: searchCities[0] ?? null,
      parsedCities: searchCities,
    })
  } catch {
    console.error('[ai-candidate-search] Search failed')
    return matchingJson({ error: 'שגיאה בחיפוש' }, 500)
  }
}
