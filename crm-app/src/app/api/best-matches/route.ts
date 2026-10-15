import { prisma } from "@/lib/prisma"
import { authorizeMatchingRequest, evidenceResponse, matchingCandidateSelect, matchingJson, matchingPositionSelect, matchingTagsFromEvidence } from '@/lib/matching-api'
import { compareEvidenceMatches, evaluatePreparedMatch, isSuggestedMatch, prepareMatchingCandidate, prepareMatchingPosition, MATCHING_ENGINE_VERSION, type EvidenceMatch } from '@/lib/matching-engine'
import { getCandidateCanonicalStatus } from '@/lib/candidate-status'

/**
 * 🎯 GET /api/best-matches
 * מחזיר את 20 ההתאמות הטובות ביותר לכל משרה פעילה
 * 
 * מנוע ראיות משותף; עיר בלבד אינה המלצה מקצועית.
 * 
 * רק מועמדים שלא בתהליך כלל!
 */
export async function GET() {
  try {
    const authorization = await authorizeMatchingRequest()
    if ('response' in authorization) return authorization.response
    const start = Date.now()
    const positions = await prisma.position.findMany({ where: { active: true, closedAt: null }, select: matchingPositionSelect, orderBy: { id: 'asc' } })
    const groups = positions.map(position => ({ position, prepared: prepareMatchingPosition(position), totalMatches: 0, ranked: [] as Array<{ candidate: Awaited<ReturnType<typeof readPage>>[number]; match: EvidenceMatch }> }))
    let cursor: string | undefined
    let totalCandidatesNotInProcess = 0
    let totalScanned = 0
    if (positions.length) while (true) {
      const page = await readPage(cursor)
      if (!page.length) break
      for (const candidate of page) {
        totalScanned++
        const status = getCandidateCanonicalStatus(candidate)
        if (status === 'hired' || status === 'in-process') continue
        totalCandidatesNotInProcess++
        const prepared = prepareMatchingCandidate(candidate)
        for (const group of groups) {
          const match = evaluatePreparedMatch(prepared, group.prepared)
          if (!isSuggestedMatch(match)) continue
          group.totalMatches++
          group.ranked.push({ candidate, match })
        }
      }
      for (const group of groups) {
        group.ranked.sort((a, b) => compareEvidenceMatches(a.match, b.match) || a.candidate.id.localeCompare(b.candidate.id))
        group.ranked.splice(20)
      }
      cursor = page[page.length - 1].id
      if (page.length < 50) break
    }
    const result = groups.filter(group => group.ranked.length).map(group => ({
      position: group.position, totalMatches: group.totalMatches,
      candidates: group.ranked.map(({ candidate, match }) => {
        const { resume: _resume, skills: _skills, applications: _applications, ...summary } = candidate
        return { ...summary, ...evidenceResponse(match), matchingTags: matchingTagsFromEvidence(candidate.tags, match) }
      }),
    }))
    result.sort((a, b) => b.candidates.reduce((sum, item) => sum + item.score, 0) / b.candidates.length - a.candidates.reduce((sum, item) => sum + item.score, 0) / a.candidates.length)
    return matchingJson({ success: true, positions: result, totalPositions: positions.length, positionsWithMatches: result.length, totalCandidatesNotInProcess,
      totalScanned, scanComplete: true, processingTime: Date.now() - start, engineVersion: MATCHING_ENGINE_VERSION,
      algorithm: 'תפקיד 35 / כישורים 25 / דרישות 25 / מיקום 15; ציון עזר ולא הסתברות',
    })
  } catch {
    console.error('[best-matches] Matching failed')
    return matchingJson({ error: 'שגיאה בחיפוש ההתאמות' }, 500)
  }
}

async function readPage(cursor?: string) {
  return prisma.candidate.findMany({
    take: 50, orderBy: { id: 'asc' }, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: { ...matchingCandidateSelect, hiredAt: true, employmentStatus: true, inProcessPositionId: true,
      applications: { select: { id: true, status: true, positionId: true } },
    },
  })
}
