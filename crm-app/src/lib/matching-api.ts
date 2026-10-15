import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from './prisma'
import { requireApiUser } from './api-authorization'
import { compareEvidenceMatches, evaluatePreparedMatch, isSuggestedMatch, prepareMatchingCandidate, prepareMatchingPosition, MATCHING_ENGINE_VERSION, MATCHING_WEIGHTS, type EvidenceMatch, type MatchTag, type MatchingPosition } from './matching-engine'
import { normalizeMatchingText } from './matching-text'
import { DEFAULT_RADIUS_KM } from './matching-location'
import { applySemanticReview, reviewMatchingSemantics } from './matching-semantic'

export const matchingIdSchema = z.string().trim().min(1).max(128).regex(/^[a-zA-Z0-9_-]+$/)
const limits = new Map<string, { startsAt: number; count: number }>()
const WINDOW_MS = 60_000
const MAX_USERS = 2000

export function matchingJson(value: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return NextResponse.json(value, { status, headers: { 'Cache-Control': 'private, no-store', ...extraHeaders } })
}

/** מגבלה תהליכית בלבד; בסביבה מרובת replicas דרוש limiter משותף כתשתית. */
export async function authorizeMatchingRequest() {
  try {
    const authorization = await requireApiUser()
    if ('response' in authorization) return authorization
    const now = Date.now()
    for (const [key, state] of limits) if (now - state.startsAt >= WINDOW_MS) limits.delete(key)
    const key = authorization.user.id
    const previous = limits.get(key)
    if ((previous && previous.count >= 30) || (!previous && limits.size >= MAX_USERS)) {
      return { response: matchingJson({ error: 'בוצעו בקשות רבות מדי. אפשר לנסות שוב בעוד דקה.', code: 'RATE_LIMIT' }, 429, { 'Retry-After': '60' }) }
    }
    limits.set(key, { startsAt: previous?.startsAt ?? now, count: (previous?.count ?? 0) + 1 })
    return authorization
  } catch {
    console.error('[matching] Authorization failed')
    return { response: matchingJson({ error: 'שגיאה בבדיקת הרשאות' }, 500) }
  }
}

export const matchingCandidateSelect = {
  id: true, name: true, city: true, currentTitle: true, currentCompany: true,
  resume: true, skills: true, yearsOfExperience: true, phone: true, email: true,
  alternatePhone: true, rating: true, createdAt: true, resumeUrl: true,
  tags: { select: { id: true, name: true, color: true } },
} as const

export const matchingPositionSelect = {
  id: true, title: true, location: true, description: true, requirements: true,
  salaryRange: true, employmentType: true, workHours: true, benefits: true,
  transportation: true, keywords: true, openings: true, contactName: true,
  active: true, closedAt: true, createdAt: true, employerId: true,
  employer: { select: { id: true, name: true, email: true } },
  tags: { select: { id: true, name: true, color: true } },
} as const

export function matchScoreBreakdown(match: EvidenceMatch) {
  return {
    ...match.breakdown, roleMaxPossible: MATCHING_WEIGHTS.role, skillsMaxPossible: MATCHING_WEIGHTS.skills,
    requirementsMaxPossible: MATCHING_WEIGHTS.requirements, locationMaxPossible: MATCHING_WEIGHTS.location,
    // שדות תאימות לא מציגים ניקוד מקומי כ-Gemini או דירוג אנושי.
    tags: 0, partial: 0, experience: 0, rating: 0, title: match.breakdown.role,
    freshness: 0, contact: 0, resume: 0, linkedin: 0, tagsMaxPossible: 0,
    geminiAI: 0, geminiMaxPossible: 0, geminiAnalyzed: false,
    keywordMatch: match.breakdown.skills, keywordMaxPossible: MATCHING_WEIGHTS.skills,
    professional: match.breakdown.role + match.breakdown.skills + match.breakdown.requirements,
    professionalMaxPossible: 85,
  }
}

export function matchingTagsFromEvidence(tags: readonly MatchTag[], match: EvidenceMatch) {
  const evidence = new Set(match.matchingTerms.map(normalizeMatchingText))
  return tags.filter(tag => evidence.has(normalizeMatchingText(tag.name)))
}

export function evidenceResponse(match: EvidenceMatch) {
  return {
    matchScore: match.score, score: match.score, matchStatus: match.status,
    strengths: match.strengths, weaknesses: match.weaknesses,
    recommendation: match.recommendation, shouldProceed: match.shouldProceed,
    locationMatch: match.location.eligible === true, locationMatchType: match.location.matchType,
    locationDetails: match.location, isExactCity: match.location.isExactCity,
    isNationwide: match.location.isNationwide, distanceKm: match.location.distanceKm,
    scoreBreakdown: matchScoreBreakdown(match), requirementChecks: match.requirements,
    evidence: match.evidence, confidence: match.confidence, coverage: match.coverage,
    semanticReview: match.semanticReview,
    engineVersion: MATCHING_ENGINE_VERSION, aiAnalyzed: !!match.semanticReview && match.semanticReview.status !== 'unavailable',
  }
}

export async function getCandidateMatchScan(candidateId: string, positionId?: string) {
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    select: {
      ...matchingCandidateSelect,
      applications: { select: { positionId: true, position: { select: { employerId: true } } } },
    },
  })
  if (!candidate) return null
  const positions = await prisma.position.findMany({
    where: { active: true, closedAt: null, ...(positionId ? { id: positionId } : {}) },
    select: matchingPositionSelect,
    orderBy: { id: 'asc' },
  })
  const prepared = prepareMatchingCandidate(candidate)
  const company = normalizeMatchingText(candidate.currentCompany ?? '')
  const scored = positions.map(position => {
    const match = evaluatePreparedMatch(prepared, prepareMatchingPosition(position))
    const hasApplied = candidate.applications.some(application => application.positionId === position.id)
    const blockedByApplication = candidate.applications.some(application => application.position.employerId === position.employerId)
    const employerName = normalizeMatchingText(position.employer.name)
    const blockedByPreviousEmployer = !!company && !!employerName && company === employerName
    return {
      position, match, hasApplied, blockedByApplication, blockedByPreviousEmployer,
      isBlocked: blockedByApplication || blockedByPreviousEmployer,
    }
  }).sort((a, b) => compareEvidenceMatches(a.match, b.match) || a.position.id.localeCompare(b.position.id))
  return { candidate, scored, totalScanned: positions.length, suggested: scored.filter(item => isSuggestedMatch(item.match)) }
}

export type CandidateMatchScan = NonNullable<Awaited<ReturnType<typeof getCandidateMatchScan>>>
export function positionMatchResponse(item: CandidateMatchScan['scored'][number]) {
  const { position, match, ...flags } = item
  return {
    ...position, ...evidenceResponse(match), ...flags,
    shouldProceed: match.shouldProceed && !flags.isBlocked,
    positionId: position.id, positionTitle: position.title, employerName: position.employer.name,
    matchingTags: matchingTagsFromEvidence(position.tags, match),
    isFieldSales: false,
  }
}

export async function enrichCandidateMatchScan(scan: CandidateMatchScan, userId: string) {
  // קודם בודקים פערי כיסוי מקצועי כדי שהמילון המקומי לא ימנע גילוי תפקיד אחר.
  // כל המשרות נסרקו מקומית; התוצאה מדווחת במפורש כמה נבדקו גם אצל הספק.
  const eligible = scan.scored.filter(item => item.match.eligible !== false && item.match.coverage.resumeQuality !== 'unreadable')
    .sort((a, b) => Number(b.match.status === 'insufficient_evidence') - Number(a.match.status === 'insufficient_evidence') || compareEvidenceMatches(a.match, b.match))
  const semantic = await reviewMatchingSemantics(scan.candidate, eligible.map(item => item.position), userId)
  for (const item of scan.scored) {
    const review = semantic.reviews.get(item.position.id)
    if (review) item.match = applySemanticReview(item.match, review)
  }
  scan.scored.sort((a, b) => compareEvidenceMatches(a.match, b.match) || a.position.id.localeCompare(b.position.id))
  scan.suggested = scan.scored.filter(item => isSuggestedMatch(item.match))
  return { requested: semantic.requested, reviewed: semantic.reviewed, verifiedLinks: semantic.verifiedLinks, status: semantic.status, reason: semantic.reason }
}

export type CandidateScanFilter = {
  minExperience?: number
  maxExperience?: number
  tagNames?: readonly string[]
}

function passesScanFilter(candidate: { yearsOfExperience: number | null; tags: readonly MatchTag[] }, filter: CandidateScanFilter): boolean {
  const years = candidate.yearsOfExperience
  if (filter.minExperience !== undefined && (years === null || years < filter.minExperience)) return false
  if (filter.maxExperience !== undefined && (years === null || years > filter.maxExperience)) return false
  if (filter.tagNames?.length) {
    const wanted = new Set(filter.tagNames.map(normalizeMatchingText))
    if (!candidate.tags.some(tag => wanted.has(normalizeMatchingText(tag.name)))) return false
  }
  return true
}

/** positionId ריק = חיפוש חופשי: אותו מנוע ראיות, בלי מצב הגשה למשרה. */
export async function scanMatchingCandidates(position: MatchingPosition, positionId: string, offset = 0, limit = 100, filter: CandidateScanFilter = {}) {
  const job = prepareMatchingPosition(position)
  const ranked: Array<{ match: EvidenceMatch; candidate: Awaited<ReturnType<typeof readCandidatePage>>[number] }> = []
  let totalScanned = 0
  let totalSuggested = 0
  let cursor: string | undefined
  while (true) {
    const page = await readCandidatePage(positionId, cursor)
    if (!page.length) break
    for (const candidate of page) {
      if (!passesScanFilter(candidate, filter)) continue
      totalScanned++
      const match = evaluatePreparedMatch(prepareMatchingCandidate(candidate), job)
      if (isSuggestedMatch(match)) { totalSuggested++; ranked.push({ candidate, match }) }
    }
    ranked.sort((a, b) => compareEvidenceMatches(a.match, b.match) || a.candidate.id.localeCompare(b.candidate.id))
    // קוראים את כל העמודים; בזיכרון שומרים רק את חלון התוצאות המבוקש.
    ranked.splice(offset + limit)
    cursor = page[page.length - 1].id
    if (page.length < 50) break
  }
  return {
    candidates: ranked.slice(offset, offset + limit).map(({ candidate, match }) => {
      const { resume: _resume, skills: _skills, ...summary } = candidate
      return {
        ...summary, ...evidenceResponse(match),
        hasApplied: candidate.applications.length > 0,
        matchingTags: matchingTagsFromEvidence(candidate.tags, match),
        whySuitable: match.strengths, comparisonTags: [], candidateCategories: [], categoryOverlap: [],
        candidateRecruitmentTags: match.matchingTerms, recruitmentTagMatch: match.matchingTerms.length,
        educationStatus: { level: '', isStudying: false, details: 'ראו דרישות וראיות; השכלה לא הוסקה אוטומטית.' },
        extractedCity: match.location.candidateCity,
      }
    }),
    totalCount: totalSuggested, totalSearched: totalScanned, totalScanned,
    offset, limit, hasMore: offset + limit < totalSuggested,
    scanComplete: true, daysBack: null, aiPowered: false, geminiAnalyzed: 0,
    engineVersion: MATCHING_ENGINE_VERSION, radiusKm: DEFAULT_RADIUS_KM,
    algorithm: `תפקיד 35 / כישורים 25 / דרישות 25 / מיקום 15 (עד ${DEFAULT_RADIUS_KM} ק"מ אווירי); ציון עזר ולא הסתברות`,
  }
}

async function readCandidatePage(positionId: string, cursor?: string) {
  return prisma.candidate.findMany({
    take: 50, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}), orderBy: { id: 'asc' },
    select: {
      ...matchingCandidateSelect, hiredAt: true,
      _count: { select: { applications: true, interviews: true } },
      applications: { where: { positionId: positionId || '__none__' }, select: { id: true, status: true } },
    },
  })
}