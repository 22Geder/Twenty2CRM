import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ModelParams, RequestOptions } from '@google/generative-ai'

type ProviderResponse = { response: { text: () => string } }
type ProviderLink = {
  kind: 'role' | 'skill'
  candidateSource: 'resume' | 'currentTitle' | 'skills'
  candidateQuote: string
  positionSource: 'title' | 'description' | 'requirements'
  positionQuote: string
}

const mocks = vi.hoisted(() => {
  const requireApiUser = vi.fn()
  const candidateFindUnique = vi.fn()
  const positionFindMany = vi.fn()
  const construct = vi.fn<(key: string) => void>()
  const generateContent = vi.fn<(prompt: string) => Promise<ProviderResponse>>()
  const getGenerativeModel = vi.fn<(params: ModelParams, options?: RequestOptions) => { generateContent: typeof generateContent }>()
  const forbiddenDatabaseOperation = vi.fn((operation: string): never => {
    throw new Error(`Forbidden database operation in ai-analysis tests: ${operation}`)
  })
  const forbiddenFetch = vi.fn((): never => { throw new Error('Network access is forbidden in ai-analysis tests') })
  const delegate = (name: string, reads: Record<string, unknown> = {}) => new Proxy(reads, {
    get(target, key) {
      if (Object.prototype.hasOwnProperty.call(target, key)) return target[String(key)]
      return () => forbiddenDatabaseOperation(`${name}.${String(key)}`)
    },
  })
  const models: Record<string, unknown> = {
    candidate: delegate('candidate', { findUnique: candidateFindUnique }),
    position: delegate('position', { findMany: positionFindMany }),
  }
  const prisma = new Proxy(models, {
    get(target, key) {
      if (Object.prototype.hasOwnProperty.call(target, key)) return target[String(key)]
      if (String(key).startsWith('$')) return () => forbiddenDatabaseOperation(String(key))
      return delegate(String(key))
    },
  })
  // בידוד לפני טעינת המסלול: אין Prisma, ספק, רשת או קובצי סביבה אמיתיים.
  vi.stubGlobal('fetch', forbiddenFetch)
  vi.stubEnv('GEMINI_API_KEY', 'synthetic-ai-analysis-key-not-a-credential')
  vi.stubEnv('GEMINI_MODEL', '')
  return { requireApiUser, candidateFindUnique, positionFindMany, construct, generateContent,
    getGenerativeModel, forbiddenDatabaseOperation, forbiddenFetch, prisma }
})

vi.mock('@/lib/api-authorization', () => ({ requireApiUser: mocks.requireApiUser }))
vi.mock('@/lib/prisma', () => ({ prisma: mocks.prisma }))
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: class {
    constructor(key: string) { mocks.construct(key) }
    getGenerativeModel = mocks.getGenerativeModel
  },
}))

import { POST } from '@/app/api/candidates/[id]/ai-analysis/route'
import * as matchingApi from '../matching-api'
import { evaluateCandidatePosition } from '../matching-engine'

type Candidate = matchingApi.CandidateMatchScan['candidate']
type Position = matchingApi.CandidateMatchScan['scored'][number]['position']
type Query = { where: Record<string, unknown>; select?: Record<string, unknown>; orderBy?: { id: 'asc' } }

const fixedDate = new Date('2026-01-01T00:00:00.000Z')
const privateDiagnostic = 'SYNTHETIC_PRIVATE_DIAGNOSTIC fixture@example.invalid FAKE-TOKEN'
const url = 'http://matching.test/api/candidates/candidate-1/ai-analysis'
let userSequence = 0
let userId: string
let person: Candidate
let jobs: Position[]

function candidate(overrides: Partial<Candidate> = {}): Candidate {
  return {
    id: 'candidate-1', name: 'מועמד בדיקה סינתטי', city: 'תל אביב', currentTitle: 'מחסנאי', currentCompany: null,
    resume: '2018–2025 מחסנאי\nעבודה שוטפת עם Priority ו-Excel.\nליקוט הזמנות ובדיקת מלאי, קבלת סחורה וסידור מוצרים במחסן המרכזי.\nתיעוד יומי של תנועות מלאי במערכת ממוחשבת והכנת הזמנות למשלוח.',
    skills: '["Priority", "Excel"]', yearsOfExperience: 7, phone: 'SYNTHETIC-PRIMARY-PHONE',
    alternatePhone: 'SYNTHETIC-ALTERNATE-PHONE', email: 'fixture@example.invalid', rating: 3,
    createdAt: fixedDate, resumeUrl: '/synthetic-cv.pdf', applications: [],
    tags: [{ id: 'tag-priority', name: 'Priority', color: null }], ...overrides,
  }
}

function position(overrides: Partial<Position> = {}): Position {
  return {
    id: 'position-1', title: 'מחסנאי', location: 'תל אביב', description: 'עבודה עם Priority ו-Excel',
    requirements: 'Priority - חובה\nExcel - יתרון', keywords: '["Priority", "Excel"]',
    salaryRange: null, employmentType: 'משרה מלאה', workHours: null, benefits: null, transportation: null,
    openings: 1, contactName: null, active: true, closedAt: null, createdAt: fixedDate,
    employerId: 'employer-1', employer: { id: 'employer-1', name: 'מעסיק סינתטי', email: 'employer@example.invalid' },
    tags: [{ id: 'tag-priority', name: 'Priority', color: null }], ...overrides,
  }
}

function application(positionId: string, employerId = 'employer-1'): Candidate['applications'][number] {
  return { positionId, position: { employerId } }
}

function request(body: unknown = { positionId: 'position-1' }) {
  return new Request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
}

function run(input = request(), id: unknown = 'candidate-1') {
  // ערכי runtime שאינם string מכוונים לבדוק Zod ולא להסתמך על טיפוסי TypeScript.
  return POST(input, { params: Promise.resolve({ id: id as string }) })
}

function response(value: unknown): ProviderResponse {
  return { response: { text: () => JSON.stringify(value) } }
}

function roleLink(overrides: Partial<ProviderLink> = {}): ProviderLink {
  return { kind: 'role', candidateSource: 'resume', candidateQuote: 'מחסנאי', positionSource: 'title', positionQuote: 'מחסנאי', ...overrides }
}

function provideLinks(links: ProviderLink[]) {
  mocks.generateContent.mockResolvedValue(response({ results: [{ id: 'position-1', links }] }))
}

async function json(result: Response, status = 200) {
  expect(result.status).toBe(status)
  expect(result.headers.get('Cache-Control')).toBe('private, no-store')
  return result.json()
}

function expectNoDataWork() {
  for (const fn of [matchingApi.getCandidateMatchScan, matchingApi.enrichCandidateMatchScan, matchingApi.positionMatchResponse,
    mocks.candidateFindUnique, mocks.positionFindMany, mocks.construct, mocks.getGenerativeModel, mocks.generateContent]) {
    expect(fn).not.toHaveBeenCalled()
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  userId = `ai-analysis-test-user-${++userSequence}`
  person = candidate()
  jobs = [position()]
  mocks.requireApiUser.mockReset().mockResolvedValue({ user: { id: userId } })
  mocks.candidateFindUnique.mockReset().mockImplementation((query: Query) => Promise.resolve(query.where.id === person.id ? person : null))
  mocks.positionFindMany.mockReset().mockImplementation((query: Query) => Promise.resolve(jobs.filter(job =>
    Object.entries(query.where).every(([key, value]) => job[key as keyof Position] === value))))
  mocks.construct.mockReset()
  mocks.getGenerativeModel.mockReset().mockReturnValue({ generateContent: mocks.generateContent })
  mocks.generateContent.mockReset().mockImplementation(prompt => {
    const payload = JSON.parse(prompt) as { positions: Array<{ id: string }> }
    return Promise.resolve(response({ results: payload.positions.map(job => ({ id: job.id, links: [] })) }))
  })
  vi.stubEnv('GEMINI_API_KEY', 'synthetic-ai-analysis-key-not-a-credential')
  vi.stubEnv('GEMINI_MODEL', '')
  vi.stubGlobal('fetch', mocks.forbiddenFetch)
  // השירות והמנוע אמיתיים; spies בודקים שהמתאם אכן מפנה אליהם לפי הסדר.
  vi.spyOn(matchingApi, 'authorizeMatchingRequest')
  vi.spyOn(matchingApi, 'getCandidateMatchScan')
  vi.spyOn(matchingApi, 'enrichCandidateMatchScan')
  vi.spyOn(matchingApi, 'positionMatchResponse')
  for (const method of ['log', 'info', 'debug', 'table', 'warn', 'error'] as const) vi.spyOn(console, method).mockImplementation(() => {})
})

afterEach(() => {
  try {
    // גם חריגה שנתפסה בייצור לא מסתירה ניסיון כתיבה/רשת או הדפסת פרטים רגישים.
    expect(mocks.forbiddenDatabaseOperation).not.toHaveBeenCalled()
    expect(mocks.forbiddenFetch).not.toHaveBeenCalled()
    for (const method of ['log', 'info', 'debug', 'table'] as const) expect(console[method]).not.toHaveBeenCalled()
    for (const call of vi.mocked(console.warn).mock.calls) expect(call).toEqual(['[matching-semantic] Review unavailable'])
    for (const call of vi.mocked(console.error).mock.calls) {
      expect(call).toHaveLength(1)
      expect(['[matching] Authorization failed', '[ai-analysis] Matching failed']).toContain(call[0])
    }
  } finally {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  }
})

describe('authorization before parsing and all data work', () => {
  it.each([401, 403, 429])('awaits authorization and returns its %i response unchanged before reading JSON', async status => {
    const input = new Request(url, { method: 'POST', body: '{' })
    const parse = vi.spyOn(input, 'json')
    const denial = Response.json({ error: 'Synthetic denial' }, {
      status, headers: { 'Cache-Control': 'private, no-store', 'Retry-After': '60' },
    })
    let finish!: (value: { response: Response }) => void
    mocks.requireApiUser.mockReturnValueOnce(new Promise(resolve => { finish = resolve }))
    const pending = run(input)
    await Promise.resolve()
    expect(matchingApi.authorizeMatchingRequest).toHaveBeenCalledTimes(1)
    expect(parse).not.toHaveBeenCalled()
    expectNoDataWork()
    finish({ response: denial })
    const result = await pending
    expect(result).toBe(denial)
    expect(await json(result, status)).toEqual({ error: 'Synthetic denial' })
    expect(result.headers.get('Retry-After')).toBe('60')
    expect(parse).not.toHaveBeenCalled()
    expectNoDataWork()
  })

  it('fails closed on an authorization exception without reading the body or logging the exception', async () => {
    mocks.requireApiUser.mockRejectedValueOnce(new Error(privateDiagnostic))
    const input = request()
    const parse = vi.spyOn(input, 'json')
    expect(await json(await run(input), 500)).toEqual({ error: 'שגיאה בבדיקת הרשאות' })
    expect(parse).not.toHaveBeenCalled()
    expectNoDataWork()
    expect(console.error).toHaveBeenCalledExactlyOnceWith('[matching] Authorization failed')
  })

  it('uses the shared request limit before JSON, scans or the provider', async () => {
    for (let index = 0; index < 30; index++) await matchingApi.authorizeMatchingRequest()
    const input = request()
    const parse = vi.spyOn(input, 'json')
    const result = await run(input)
    expect(await json(result, 429)).toMatchObject({ code: 'RATE_LIMIT' })
    expect(result.headers.get('Retry-After')).toBe('60')
    expect(parse).not.toHaveBeenCalled()
    expectNoDataWork()
  })
})

describe('Zod JSON and identifier validation', () => {
  it.each([
    { name: 'malformed JSON', raw: '{' }, { name: 'empty body', raw: '' },
    { name: 'null body', raw: 'null' }, { name: 'array body', raw: '[]' },
    { name: 'string body', raw: '"position-1"' }, { name: 'missing position id', raw: '{}' },
    { name: 'null id', raw: '{"positionId":null}' }, { name: 'numeric id', raw: '{"positionId":7}' },
    { name: 'boolean id', raw: '{"positionId":true}' }, { name: 'object id', raw: '{"positionId":{}}' },
    { name: 'array id', raw: '{"positionId":["position-1"]}' }, { name: 'empty id', raw: '{"positionId":""}' },
    { name: 'whitespace id', raw: '{"positionId":"   "}' }, { name: 'path id', raw: '{"positionId":"../position"}' },
    { name: 'encoded separator', raw: '{"positionId":"position%2F1"}' },
    { name: 'oversized id', raw: JSON.stringify({ positionId: 'p'.repeat(129) }) },
  ])('returns 400 for $name without scanning', async ({ raw }) => {
    const result = await run(new Request(url, { method: 'POST', body: raw }))
    expect(await json(result, 400)).toMatchObject({ error: expect.any(String), code: 'INVALID_INPUT' })
    expectNoDataWork()
    expect(console.error).not.toHaveBeenCalled()
  })

  it.each([
    { name: 'missing', id: undefined }, { name: 'null', id: null }, { name: 'numeric', id: 42 },
    { name: 'empty', id: '' }, { name: 'whitespace', id: '  ' }, { name: 'path traversal', id: '../candidate' },
    { name: 'separator', id: 'candidate/1' }, { name: 'non-ASCII', id: 'מזהה' },
    { name: 'oversized', id: 'c'.repeat(129) },
  ])('returns 400 for a $name URL candidate id before parsing the body', async ({ id }) => {
    const input = request()
    const parse = vi.spyOn(input, 'json')
    // העברה ישירה משמרת גם undefined במקום ברירת המחדל של run.
    const result = await POST(input, { params: Promise.resolve({ id: id as string }) })
    expect(await json(result, 400)).toMatchObject({ code: 'INVALID_INPUT' })
    expect(parse).not.toHaveBeenCalled()
    expectNoDataWork()
  })

  it.each([1, 128])('trims both ids and accepts the inclusive %i-character boundary', async length => {
    person.id = 'c'.repeat(length)
    jobs[0].id = 'p'.repeat(length)
    const body = await json(await run(request({ positionId: ` ${jobs[0].id} ` }), ` ${person.id} `))
    expect(matchingApi.getCandidateMatchScan).toHaveBeenCalledExactlyOnceWith(person.id, jobs[0].id)
    expect(body.positionId).toBe(jobs[0].id)
  })
})

describe('missing candidate and open-job scoping', () => {
  it('returns 404 for a missing candidate without reading jobs or invoking enrichment', async () => {
    expect(await json(await run(request(), 'missing-candidate'), 404)).toEqual({ error: 'מועמד לא נמצא' })
    expect(mocks.positionFindMany).not.toHaveBeenCalled()
    expect(matchingApi.enrichCandidateMatchScan).not.toHaveBeenCalled()
    expect(mocks.construct).not.toHaveBeenCalled()
  })

  it.each(['missing', 'inactive', 'closed'])('returns 404 for a %s job before enrichment or provider work', async state => {
    jobs = state === 'missing' ? [position({ id: 'other-position' })]
      : [position(state === 'inactive' ? { active: false } : { closedAt: fixedDate })]
    expect(await json(await run(), 404)).toEqual({ error: 'משרה פתוחה לא נמצאה' })
    expect(mocks.positionFindMany).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
      where: { id: 'position-1', active: true, closedAt: null },
    }))
    expect(matchingApi.enrichCandidateMatchScan).not.toHaveBeenCalled()
    expect(matchingApi.positionMatchResponse).not.toHaveBeenCalled()
    expect(mocks.construct).not.toHaveBeenCalled()
  })
})

describe('shared scoring, evidence and legacy response compatibility', () => {
  it('authorizes, scans only the requested job, enriches, then formats the full evidence response', async () => {
    const expected = evaluateCandidatePosition(person, jobs[0])
    expect(expected.coverage.resumeQuality).toBe('readable')
    provideLinks([roleLink()])
    jobs.push(position({ id: 'other-position' }))
    const snapshot = structuredClone({ person, jobs })
    const input = request()
    const parse = vi.spyOn(input, 'json')
    const body = await json(await run(input))
    const scan = (await vi.mocked(matchingApi.getCandidateMatchScan).mock.results[0].value)!
    expect(matchingApi.getCandidateMatchScan).toHaveBeenCalledExactlyOnceWith('candidate-1', 'position-1')
    expect(scan.scored).toHaveLength(1)
    expect(matchingApi.enrichCandidateMatchScan).toHaveBeenCalledExactlyOnceWith(scan, userId)
    expect(matchingApi.positionMatchResponse).toHaveBeenCalledExactlyOnceWith(scan.scored[0])
    const calls = [vi.mocked(matchingApi.authorizeMatchingRequest), parse, vi.mocked(matchingApi.getCandidateMatchScan),
      vi.mocked(matchingApi.enrichCandidateMatchScan), mocks.generateContent, vi.mocked(matchingApi.positionMatchResponse)]
    const order = calls.map(fn => fn.mock.invocationCallOrder[0])
    expect(order).toEqual([...order].sort((a, b) => a - b))
    expect(body).toMatchObject({
      candidateName: person.name, positionId: jobs[0].id, positionTitle: jobs[0].title, employerName: jobs[0].employer.name,
      matchScore: expected.score, score: expected.score, matchStatus: expected.status, confidence: expected.confidence,
      strengths: expected.strengths, weaknesses: expected.weaknesses, recommendation: expected.recommendation,
      evidence: expected.evidence, requirementChecks: expected.requirements, coverage: expected.coverage,
      locationDetails: expected.location, scoreBreakdown: expected.breakdown, shouldProceed: expected.shouldProceed,
      workedAtCompanyBefore: false, aiAnalyzed: true, analysisMode: 'local-and-semantic',
      semanticReview: { status: 'complete', links: [expect.objectContaining({ kind: 'role' })] },
      semanticCoverage: { requested: 1, reviewed: 1, verifiedLinks: 1, status: 'complete', reason: 'completed' },
    })
    expect(body.engineVersion).toBe(expected.version)
    expect(body.strengths).toHaveLength(expected.strengths.length)
    expect(body.weaknesses).toHaveLength(0)
    expect(body.aiInsights).toContain('הבדיקה הסמנטית הושלמה;')
    expect(body.aiInsights).toContain('כיסוי סמנטי: 1/1')
    expect(body.aiInsights).toContain('אינו הסתברות')
    expect(body.insights).toBe(body.aiInsights)
    for (const evidence of expected.evidence) {
      expect(evidence.source).not.toBe('tags')
      // אופסטים בכישורים מתייחסים לרשימה שפוענחה, לא לתווי מעטפת ה-JSON במסד.
      const source = evidence.source === 'skills'
        ? (JSON.parse(person.skills!) as string[]).join('\n')
        : person[evidence.source as 'resume' | 'currentTitle']!
      expect(source.slice(evidence.start, evidence.end)).toBe(evidence.quote)
    }
    const payload = JSON.parse(mocks.generateContent.mock.calls[0][0])
    expect(payload.positions).toHaveLength(1)
    expect(payload.positions[0].id).toBe('position-1')
    for (const field of ['resume', 'phone', 'alternatePhone', 'email', 'applications']) expect(body).not.toHaveProperty(field)
    expect(JSON.stringify(body)).not.toContain(person.email)
    expect({ person, jobs }).toEqual(snapshot)
    expect(console.warn).not.toHaveBeenCalled()
    expect(console.error).not.toHaveBeenCalled()
  })

  it('uses the URL candidate and authenticated user, ignoring client identity, scores and semantic opt-out', async () => {
    const body = await json(await run(request({
      positionId: 'position-1', candidateId: 'spoofed-candidate', userId: 'spoofed-user', semantic: false,
      matchScore: 999, shouldProceed: false, workedAtCompanyBefore: true,
    })))
    expect(matchingApi.getCandidateMatchScan).toHaveBeenCalledExactlyOnceWith('candidate-1', 'position-1')
    expect(matchingApi.enrichCandidateMatchScan).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ candidate: person }), userId)
    expect(mocks.generateContent).toHaveBeenCalledTimes(1)
    expect(body).toMatchObject({ matchScore: evaluateCandidatePosition(person, jobs[0]).score, workedAtCompanyBefore: false })
  })

  it('reports a completed semantic review with zero links without inventing evidence or padding', async () => {
    const expected = evaluateCandidatePosition(person, jobs[0])
    const body = await json(await run())
    expect(body).toMatchObject({
      strengths: expected.strengths, weaknesses: expected.weaknesses, matchScore: expected.score,
      semanticCoverage: { requested: 1, reviewed: 1, verifiedLinks: 0, status: 'complete' },
      semanticReview: { status: 'complete', links: [] }, aiAnalyzed: true,
    })
    expect(body.strengths.length).toBeLessThan(5)
    expect(body.weaknesses).toEqual([])
    expect(body.aiInsights).toContain('0 קישורי ראיות')
  })

  it('reports partial coverage and only verified semantic quotes, not a complete analysis', async () => {
    provideLinks([roleLink(), roleLink({ candidateQuote: 'מומחה סינתטי שלא הופיע במקור' })])
    const body = await json(await run())
    expect(body).toMatchObject({
      semanticCoverage: { requested: 1, reviewed: 1, verifiedLinks: 1, status: 'partial', reason: 'partial_or_failed' },
      semanticReview: { status: 'partial' }, aiAnalyzed: true, analysisMode: 'local-and-semantic',
    })
    expect(body.semanticReview.links).toHaveLength(1)
    expect(body.semanticReview.links[0].candidate.quote).toBe('מחסנאי')
    expect(body.aiInsights).toContain('הושלמה חלקית')
    expect(body.aiInsights).not.toContain('הבדיקה הסמנטית הושלמה;')
    expect(body.insights).toBe(body.aiInsights)
  })

  it('keeps a genuine zero score and empty strengths on local fallback instead of default 50 or five points', async () => {
    vi.stubEnv('GEMINI_API_KEY', '')
    person = candidate({ resume: null, currentTitle: null, skills: null, city: null, tags: [] })
    jobs = [position({ location: null, requirements: null, description: null, keywords: null, tags: [] })]
    const expected = evaluateCandidatePosition(person, jobs[0])
    expect(expected.score).toBe(0)
    const body = await json(await run())
    expect(body).toMatchObject({
      matchScore: 0, score: 0, matchStatus: 'insufficient_evidence', strengths: [], weaknesses: expected.weaknesses,
      recommendation: expected.recommendation, aiAnalyzed: false, analysisMode: 'local-evidence',
      coverage: { resumeQuality: 'missing' },
      semanticCoverage: { requested: 1, reviewed: 0, verifiedLinks: 0, status: 'unavailable', reason: 'no_key' },
    })
    expect(body.weaknesses.length).toBeLessThan(5)
    expect(body.aiInsights).toContain('לא זמינה')
    expect(body.aiInsights).toContain('כיסוי סמנטי: 0/1')
    expect(body.insights).toBe(body.aiInsights)
    expect(mocks.construct).not.toHaveBeenCalled()
  })

  it('preserves more than five real requirement gaps without truncation', async () => {
    jobs[0].requirements = ['תנאי בדיקה א', 'תנאי בדיקה ב', 'תנאי בדיקה ג', 'תנאי בדיקה ד', 'תנאי בדיקה ה', 'תנאי בדיקה ו'].join('\n')
    const expected = evaluateCandidatePosition(person, jobs[0])
    expect(expected.weaknesses.length).toBeGreaterThan(5)
    const body = await json(await run())
    expect(body.weaknesses).toEqual(expected.weaknesses)
    expect(body.requirementChecks).toEqual(expected.requirements)
  })
})

describe('shared eligibility and blocking flags', () => {
  it.each(['unreadable CV', 'distance gate', 'contradicted mandatory license'])('does not claim semantic completion when skipped for %s', async reason => {
    if (reason === 'unreadable CV') person.resume = '\uFFFD'.repeat(80)
    else if (reason === 'distance gate') jobs[0].location = 'אילת'
    else {
      person.resume += '\nאין רישיון מלגזה.'
      jobs[0].requirements += '\nרישיון מלגזה - חובה'
    }
    const expected = evaluateCandidatePosition(person, jobs[0])
    const body = await json(await run())
    expect(body).toMatchObject({
      matchScore: expected.score, matchStatus: expected.status, shouldProceed: expected.shouldProceed,
      coverage: expected.coverage, requirementChecks: expected.requirements,
      aiAnalyzed: false, analysisMode: 'local-evidence',
      semanticCoverage: { requested: 0, reviewed: 0, verifiedLinks: 0, status: 'complete', reason: 'completed' },
    })
    expect(matchingApi.enrichCandidateMatchScan).toHaveBeenCalledTimes(1)
    expect(mocks.construct).not.toHaveBeenCalled()
    expect(body.aiInsights).toContain('לא בוצעה בדיקה סמנטית')
    expect(body.aiInsights).not.toContain('הושלמה')
    if (reason !== 'unreadable CV') expect(body.shouldProceed).toBe(false)
  })

  it('does not turn an unverified mandatory license into permission to proceed after successful AI review', async () => {
    jobs[0].requirements += '\nרישיון מלגזה - חובה'
    provideLinks([roleLink()])
    const body = await json(await run())
    expect(body).toMatchObject({ matchStatus: 'review', shouldProceed: false, aiAnalyzed: true })
    expect(body.requirementChecks).toContainEqual(expect.objectContaining({ text: 'רישיון מלגזה - חובה', status: 'unknown' }))
  })

  it.each([
    { name: 'clear', currentCompany: null, applications: [], hasApplied: false, blockedByApplication: false, blockedByPreviousEmployer: false },
    { name: 'normalized previous employer', currentCompany: '  מעסיק   סינתטי  ', applications: [], hasApplied: false, blockedByApplication: false, blockedByPreviousEmployer: true },
    { name: 'substring is not a previous employer', currentCompany: 'מעסיק', applications: [], hasApplied: false, blockedByApplication: false, blockedByPreviousEmployer: false },
    { name: 'same-job application', currentCompany: null, applications: [application('position-1')], hasApplied: true, blockedByApplication: true, blockedByPreviousEmployer: false },
    { name: 'same-employer application', currentCompany: null, applications: [application('other-position')], hasApplied: false, blockedByApplication: true, blockedByPreviousEmployer: false },
    { name: 'unrelated employer application', currentCompany: null, applications: [application('other-position', 'other-employer')], hasApplied: false, blockedByApplication: false, blockedByPreviousEmployer: false },
    { name: 'both blocks', currentCompany: 'מעסיק סינתטי', applications: [application('position-1')], hasApplied: true, blockedByApplication: true, blockedByPreviousEmployer: true },
  ])('preserves $name flags and aliases only the previous-employer flag', async ({ currentCompany, applications, hasApplied, blockedByApplication, blockedByPreviousEmployer }) => {
    person = candidate({ currentCompany, applications })
    const expected = evaluateCandidatePosition(person, jobs[0])
    expect(expected.shouldProceed).toBe(true)
    const body = await json(await run())
    const isBlocked = blockedByApplication || blockedByPreviousEmployer
    expect(body).toMatchObject({
      hasApplied, blockedByApplication, blockedByPreviousEmployer, isBlocked,
      workedAtCompanyBefore: blockedByPreviousEmployer, shouldProceed: !isBlocked,
      matchScore: expected.score, recommendation: expected.recommendation,
    })
  })
})

describe('provider fallback and generic internal errors', () => {
  it.each(['constructor', 'model', 'generation', 'response text', 'invalid JSON'])('lets the shared semantic helper handle %s failures with a 200 local fallback', async failure => {
    const fail = (): never => { throw new Error(privateDiagnostic) }
    if (failure === 'constructor') mocks.construct.mockImplementationOnce(fail)
    else if (failure === 'model') mocks.getGenerativeModel.mockImplementationOnce(fail)
    else if (failure === 'generation') mocks.generateContent.mockRejectedValueOnce(new Error(privateDiagnostic))
    else mocks.generateContent.mockResolvedValueOnce({ response: { text: failure === 'response text' ? fail : () => `{ ${privateDiagnostic}` } })
    const expected = evaluateCandidatePosition(person, jobs[0])
    const body = await json(await run())
    expect(body).toMatchObject({
      matchScore: expected.score, strengths: expected.strengths, weaknesses: expected.weaknesses,
      evidence: expected.evidence, recommendation: expected.recommendation,
      aiAnalyzed: false, analysisMode: 'local-evidence',
      semanticReview: { status: 'unavailable', links: [] },
      semanticCoverage: { requested: 1, reviewed: 0, verifiedLinks: 0, status: 'unavailable', reason: 'partial_or_failed' },
    })
    expect(body.aiInsights).toContain('ראיות מקומיות בלבד')
    expect(body.aiInsights).not.toContain('הושלמה')
    expect(JSON.stringify(body)).not.toContain(privateDiagnostic)
    expect(console.warn).toHaveBeenCalledExactlyOnceWith('[matching-semantic] Review unavailable')
    expect(console.error).not.toHaveBeenCalled()
  })

  it.each(['candidate read', 'position read', 'enrichment', 'response formatting'])('returns a generic 500 for unexpected %s errors without PII or provider details', async failure => {
    if (failure === 'candidate read') mocks.candidateFindUnique.mockRejectedValueOnce(new Error(privateDiagnostic))
    else if (failure === 'position read') mocks.positionFindMany.mockRejectedValueOnce(new Error(privateDiagnostic))
    else if (failure === 'enrichment') vi.mocked(matchingApi.enrichCandidateMatchScan).mockRejectedValueOnce(new Error(privateDiagnostic))
    else vi.mocked(matchingApi.positionMatchResponse).mockImplementationOnce(() => { throw new Error(privateDiagnostic) })
    expect(await json(await run(), 500)).toEqual({ error: 'שגיאה בניתוח ההתאמה' })
    expect(console.error).toHaveBeenCalledExactlyOnceWith('[ai-analysis] Matching failed')
  })
})

it('contains only the shared runtime adapter, without unreachable legacy analyzers, direct provider/DB imports or default 50', () => {
  const source = readFileSync(new URL('../../app/api/candidates/[id]/ai-analysis/route.ts', import.meta.url), 'utf8')
  expect([...source.matchAll(/from\s+["']([^"']+)["']/g)].map(match => match[1])).toEqual(['zod', '@/lib/matching-api'])
  expect(source).not.toMatch(/analyzeWithGeminiAI|ensureExactFive|fallbackAnalysis|getDefaultRecommendation|GoogleGenerativeAI|generateContent|process\.env|\bprisma\b/)
  expect(source).not.toMatch(/(?:\|\||\?\?)\s*50\b/)
})