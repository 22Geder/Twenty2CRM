import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => {
  const requireApiUser = vi.fn()
  const candidateFindUnique = vi.fn()
  const candidateFindMany = vi.fn()
  const positionFindUnique = vi.fn()
  const positionFindMany = vi.fn()
  const forbiddenDatabaseOperation = vi.fn((operation: string): never => {
    throw new Error(`Unexpected database operation in read-only matching tests: ${operation}`)
  })
  const forbiddenFetch = vi.fn((): never => {
    throw new Error('Network access is forbidden in matching route tests')
  })
  const delegate = (name: string, reads: Record<string, unknown> = {}) => new Proxy(reads, {
    get(target, key) {
      if (Object.prototype.hasOwnProperty.call(target, key)) return target[String(key)]
      return () => forbiddenDatabaseOperation(`${name}.${String(key)}`)
    },
  })
  const models: Record<string, unknown> = {
    candidate: delegate('candidate', { findUnique: candidateFindUnique, findMany: candidateFindMany }),
    position: delegate('position', { findUnique: positionFindUnique, findMany: positionFindMany }),
  }
  const prisma = new Proxy(models, {
    get(target, key) {
      if (Object.prototype.hasOwnProperty.call(target, key)) return target[String(key)]
      if (String(key).startsWith('$')) return () => forbiddenDatabaseOperation(String(key))
      return delegate(String(key))
    },
  })

  // החסימה קיימת עוד לפני טעינת המסלולים; אין לקוח Prisma או חיבור רשת אמיתי.
  vi.stubGlobal('fetch', forbiddenFetch)
  return { requireApiUser, candidateFindUnique, candidateFindMany, positionFindUnique, positionFindMany,
    forbiddenDatabaseOperation, forbiddenFetch, prisma }
})

vi.mock('@/lib/api-authorization', () => ({ requireApiUser: mocks.requireApiUser }))
vi.mock('@/lib/prisma', () => ({ prisma: mocks.prisma }))

import { POST as postAiMatch } from '@/app/api/ai-match-v3/route'
import { GET as getCandidatePositions } from '@/app/api/candidates/[id]/matching-positions/route'
import { GET as getPositionCandidates } from '@/app/api/positions/[id]/matching-candidates/route'
import { GET as getBestMatches } from '@/app/api/best-matches/route'
import { authorizeMatchingRequest, getCandidateMatchScan, scanMatchingCandidates } from '../matching-api'
import { evaluateCandidatePosition, MATCHING_ENGINE_VERSION } from '../matching-engine'

type Row = Record<string, unknown>
type Where = Record<string, unknown>
type Selection = { [key: string]: boolean | { select?: Selection; where?: Where } }
type Query = {
  where?: Where
  select?: Selection
  orderBy?: { id: 'asc' | 'desc' }
  cursor?: { id: string }
  skip?: number
  take?: number
}

const fixedDate = new Date('2026-01-01T00:00:00.000Z')
const diagnosticMarker = 'SYNTHETIC_INTERNAL_DIAGNOSTIC'
const readMocks = [mocks.candidateFindUnique, mocks.candidateFindMany, mocks.positionFindUnique, mocks.positionFindMany]
let userSequence = 0
let userId: string
let candidates: Row[]
let positions: Row[]
let candidatePageIds: string[][]

function candidate(id = 'candidate-1', overrides: Row = {}) {
  return {
    id, name: 'Synthetic candidate', city: 'תל אביב', currentTitle: 'מחסנאי', currentCompany: null,
    resume: 'מגורים: תל אביב\n2017–2025 מחסנאי. עבודה עם Priority ו-Excel.\nליקוט הזמנות וספירות מלאי במחסן.',
    skills: '["Priority", "Excel"]', yearsOfExperience: 8,
    phone: 'TEST-PRIMARY-PHONE', alternatePhone: 'TEST-ALTERNATE-PHONE', email: 'candidate@example.test',
    rating: 3, createdAt: fixedDate, resumeUrl: '/synthetic-resume.pdf',
    tags: [{ id: 'tag-priority', name: 'Priority', color: '#123456' }, { id: 'tag-unproven', name: 'SAP', color: null }],
    applications: [], hiredAt: null, employmentStatus: null, inProcessPositionId: null,
    internalNotes: 'SYNTHETIC_UNSELECTED_FIELD', ...overrides,
  }
}

function position(id = 'position-1', overrides: Row = {}) {
  return {
    id, title: 'מחסנאי', location: 'תל אביב', description: 'עבודה עם Priority ו-Excel',
    requirements: 'Priority - חובה\nExcel - יתרון', keywords: '["Priority", "Excel"]',
    salaryRange: 'TEST-SALARY', employmentType: 'משרה מלאה', workHours: '08:00–17:00',
    benefits: 'TEST-BENEFITS', transportation: 'ללא הסעות', openings: 2, contactName: 'Synthetic contact',
    active: true, closedAt: null, createdAt: fixedDate, employerId: 'employer-1',
    employer: { id: 'employer-1', name: 'Synthetic employer', email: 'employer@example.test', internalNotes: 'HIDDEN' },
    tags: [{ id: 'tag-priority', name: 'Priority', color: '#123456' }],
    internalNotes: 'SYNTHETIC_UNSELECTED_FIELD', ...overrides,
  }
}

function application(positionId: string, employerId = 'employer-1', status = 'REJECTED') {
  return { id: `application-${positionId}`, positionId, status, position: { employerId } }
}

function matchesWhere(row: Row, where: Where = {}) {
  return Object.entries(where).every(([key, value]) => row[key] === value)
}

// מסננים ומקרינים גם relations: החזרת fixture מלא הייתה מסתירה select חסר או where שגוי.
function project(row: Row, select?: Selection): Row {
  if (!select) return { ...row }
  return Object.fromEntries(Object.entries(select).filter(([, selection]) => selection !== false).map(([key, selection]) => {
    if (!(key in row)) throw new Error(`Unsupported synthetic selector: ${key}`)
    const value = row[key]
    if (typeof selection === 'boolean' || value == null) return [key, value]
    if (Array.isArray(value)) {
      return [key, (value as Row[]).filter(item => matchesWhere(item, selection.where)).map(item => project(item, selection.select))]
    }
    return [key, project(value as Row, selection.select)]
  }))
}

function readUnique(rows: Row[], query: Query) {
  const found = rows.find(row => matchesWhere(row, query.where))
  return found ? project(found, query.select) : null
}

function readMany(rows: Row[], query: Query): Row[] {
  let selected = rows.filter(row => matchesWhere(row, query.where))
  if (query.orderBy) {
    const direction = query.orderBy.id === 'asc' ? 1 : -1
    selected = [...selected].sort((a, b) => direction * String(a.id).localeCompare(String(b.id)))
  }
  const cursorIndex = query.cursor ? selected.findIndex(row => row.id === query.cursor!.id) : 0
  if (cursorIndex < 0) throw new Error('Unknown synthetic cursor')
  const start = cursorIndex + (query.skip ?? 0)
  return selected.slice(start, query.take === undefined ? undefined : start + query.take).map(row => project(row, query.select))
}

function readCandidates(query: Query) {
  const page = readMany(candidates, query)
  candidatePageIds.push(page.map(row => String(row.id)))
  return Promise.resolve(page)
}

function requestBody(body: unknown) {
  return new Request('http://matching.test/api/ai-match-v3', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })
}

function candidateRequest(id = 'candidate-1', query = '') {
  return getCandidatePositions(new NextRequest(`http://matching.test/api/candidates/test/matching-positions${query}`), {
    params: Promise.resolve({ id }),
  })
}

function positionRequest(id = 'position-1', query = '') {
  return getPositionCandidates(new NextRequest(`http://matching.test/api/positions/test/matching-candidates${query}`), {
    params: Promise.resolve({ id }),
  })
}

async function json(response: Response, status = 200) {
  expect(response.status).toBe(status)
  expect(response.headers.get('Cache-Control')).toBe('private, no-store')
  return response.json()
}

function expectNoReads() {
  for (const read of readMocks) expect(read).not.toHaveBeenCalled()
}

function expectOpenPositionScan(positionId?: string) {
  expect(mocks.positionFindMany).toHaveBeenCalledTimes(1)
  const [query] = mocks.positionFindMany.mock.calls[0] as [Query]
  expect(query.where).toEqual({ active: true, closedAt: null, ...(positionId ? { id: positionId } : {}) })
  expect(query.orderBy).toEqual({ id: 'asc' })
  expect(query.take).toBeUndefined()
  expect(query.skip).toBeUndefined()
  expect(query.cursor).toBeUndefined()
  expect(query.select).toMatchObject({ id: true, description: true, requirements: true, active: true, closedAt: true })
}

function expectCompleteCursorScan(total: number, positionId?: string) {
  const orderedIds = candidates.map(row => String(row.id)).sort((a, b) => a.localeCompare(b))
  const pageCount = Math.floor(total / 50) + 1
  expect(mocks.candidateFindMany).toHaveBeenCalledTimes(pageCount)
  expect(candidatePageIds.flat()).toEqual(orderedIds)
  expect(new Set(candidatePageIds.flat()).size).toBe(total)
  for (let index = 0; index < pageCount; index++) {
    const [query] = mocks.candidateFindMany.mock.calls[index] as [Query]
    expect(query.take).toBe(50)
    expect(query.orderBy).toEqual({ id: 'asc' })
    expect(query.where).toBeUndefined()
    expect(query.cursor).toEqual(index ? { id: orderedIds[index * 50 - 1] } : undefined)
    expect(query.skip).toBe(index ? 1 : undefined)
    expect(query.select).toMatchObject({ resume: true, skills: true, alternatePhone: true })
    expect(query.select?.applications).toEqual(positionId
      ? { where: { positionId }, select: { id: true, status: true } }
      : { select: { id: true, status: true, positionId: true } })
  }
}

function seedOpenJobs() {
  const suggested = Array.from({ length: 137 }, (_, index) => position(`position-${String(index).padStart(4, '0')}`, {
    ...(index < 136 ? { requirements: 'רישיון מלגזה - חובה' } : {}),
  }))
  positions = [
    ...suggested,
    position('position-unrelated', { title: 'מפתח Java', description: 'Java', requirements: 'Java - חובה', keywords: '["Java"]', tags: [] }),
    position('position-far', { location: 'אילת' }),
    position('position-inactive', { active: false }),
    position('position-closed', { closedAt: fixedDate }),
  ]
  return [suggested[136].id, ...suggested.slice(0, 136).map(row => row.id)]
}

function seedCandidatePages() {
  candidates = Array.from({ length: 551 }, (_, index) => candidate(`candidate-${String(index).padStart(4, '0')}`, {
    ...(index < 525 ? { resume: 'מחסנאי עם ניסיון בליקוט הזמנות', skills: '[]' } : {}),
    ...(index >= 525 && index < 550 ? { currentTitle: 'מפתח Java', resume: 'מפתח Java', skills: '["Java"]', tags: [] } : {}),
  }))
  candidates[0].applications = [application('position-1'), application('position-other')]
  candidates[1].applications = [application('position-other')]
  return ['candidate-0550', ...Array.from({ length: 525 }, (_, index) => `candidate-${String(index).padStart(4, '0')}`)]
}

const routes = [
  { name: 'ai-match-v3', run: () => postAiMatch(requestBody({ candidateId: 'candidate-1' })), firstRead: mocks.candidateFindUnique, log: '[ai-match-v3] Matching failed' },
  { name: 'matching-positions', run: () => candidateRequest(), firstRead: mocks.candidateFindUnique, log: '[matching-positions] Matching failed' },
  { name: 'matching-candidates', run: () => positionRequest(), firstRead: mocks.positionFindUnique, log: '[matching-candidates] Matching failed' },
  { name: 'best-matches', run: () => getBestMatches(), firstRead: mocks.positionFindMany, log: '[best-matches] Matching failed' },
] as const

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('GEMINI_API_KEY', '')
  userId = `matching-route-test-user-${++userSequence}`
  mocks.requireApiUser.mockReset().mockResolvedValue({ user: { id: userId } })
  candidates = [candidate()]
  positions = [position()]
  candidatePageIds = []
  mocks.candidateFindUnique.mockReset().mockImplementation((query: Query) => Promise.resolve(readUnique(candidates, query)))
  mocks.candidateFindMany.mockReset().mockImplementation(readCandidates)
  mocks.positionFindUnique.mockReset().mockImplementation((query: Query) => Promise.resolve(readUnique(positions, query)))
  mocks.positionFindMany.mockReset().mockImplementation((query: Query) => Promise.resolve(readMany(positions, query)))
  vi.stubGlobal('fetch', mocks.forbiddenFetch)
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  try {
    // גם אם המסלול תפס חריגה, ניסיון כתיבה או רשת חייב להכשיל את הבדיקה.
    expect(mocks.forbiddenDatabaseOperation).not.toHaveBeenCalled()
    expect(mocks.forbiddenFetch).not.toHaveBeenCalled()
  } finally {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  }
})

describe.each(routes)('$name authorization and safe errors', route => {
  it.each([401, 403])('awaits authorization and returns %i before any data work', async status => {
    const denial = Response.json({ error: status === 401 ? 'Unauthorized' : 'Forbidden' }, {
      status, headers: { 'Cache-Control': 'private, no-store' },
    })
    let finishAuthorization!: (value: { response: Response }) => void
    mocks.requireApiUser.mockReturnValue(new Promise(resolve => { finishAuthorization = resolve }))

    const pending = route.run()
    await Promise.resolve()
    expect(mocks.requireApiUser).toHaveBeenCalledTimes(1)
    expectNoReads()
    finishAuthorization({ response: denial })

    const response = await pending
    expect(response).toBe(denial)
    expect(await json(response, status)).toEqual({ error: status === 401 ? 'Unauthorized' : 'Forbidden' })
    expectNoReads()
    expect(console.error).not.toHaveBeenCalled()
  })

  it('fails closed on an authorization exception without logging its details', async () => {
    mocks.requireApiUser.mockRejectedValue(new Error(diagnosticMarker))
    const body = await json(await route.run(), 500)
    expect(body).toEqual({ error: expect.any(String) })
    expect(JSON.stringify(body)).not.toContain(diagnosticMarker)
    expect(console.error).toHaveBeenCalledExactlyOnceWith('[matching] Authorization failed')
    expectNoReads()
  })

  it('authorizes a successful request before its first data read', async () => {
    await json(await route.run())
    expect(mocks.requireApiUser).toHaveBeenCalledTimes(1)
    expect(mocks.requireApiUser.mock.invocationCallOrder[0]).toBeLessThan(route.firstRead.mock.invocationCallOrder[0])
    expect(console.error).not.toHaveBeenCalled()
  })

  it('returns a generic 500 and a single fixed log on a database error', async () => {
    route.firstRead.mockRejectedValueOnce(new Error(diagnosticMarker))
    const body = await json(await route.run(), 500)
    expect(body).toEqual({ error: expect.any(String) })
    expect(JSON.stringify(body)).not.toContain(diagnosticMarker)
    expect(console.error).toHaveBeenCalledExactlyOnceWith(route.log)
  })
})

describe('input validation before reads', () => {
  it('does not parse the POST body before authorization', async () => {
    const request = requestBody({ candidateId: 'candidate-1' })
    const parse = vi.spyOn(request, 'json')
    mocks.requireApiUser.mockResolvedValue({ response: Response.json({ error: 'Unauthorized' }, {
      status: 401, headers: { 'Cache-Control': 'private, no-store' },
    }) })
    await json(await postAiMatch(request), 401)
    expect(parse).not.toHaveBeenCalled()
    expectNoReads()
  })

  it.each([
    { name: 'malformed JSON', raw: '{' },
    { name: 'empty body', raw: '' },
    { name: 'null body', raw: 'null' },
    { name: 'array body', raw: '[]' },
    { name: 'missing candidate id', raw: '{}' },
    { name: 'numeric candidate id', raw: '{"candidateId":42}' },
    { name: 'empty candidate id', raw: '{"candidateId":"  "}' },
    { name: 'path-like candidate id', raw: '{"candidateId":"../candidate"}' },
    { name: 'oversized candidate id', raw: JSON.stringify({ candidateId: 'x'.repeat(129) }) },
    { name: 'empty optional position id', raw: '{"candidateId":"candidate-1","positionId":""}' },
    { name: 'null optional position id', raw: '{"candidateId":"candidate-1","positionId":null}' },
    { name: 'numeric optional position id', raw: '{"candidateId":"candidate-1","positionId":42}' },
    { name: 'path-like optional position id', raw: '{"candidateId":"candidate-1","positionId":"a/b"}' },
    { name: 'oversized optional position id', raw: JSON.stringify({ candidateId: 'candidate-1', positionId: 'x'.repeat(129) }) },
  ])('rejects $name', async ({ raw }) => {
    const request = new Request('http://matching.test/api/ai-match-v3', { method: 'POST', body: raw })
    expect(await json(await postAiMatch(request), 400)).toMatchObject({ error: expect.any(String), code: 'INVALID_INPUT' })
    expectNoReads()
    expect(console.error).not.toHaveBeenCalled()
  })

  describe.each([
    { name: 'candidate positions', run: candidateRequest },
    { name: 'position candidates', run: positionRequest },
  ])('$name', ({ run }) => {
    it.each([
      { name: 'empty', id: '' }, { name: 'whitespace', id: '   ' },
      { name: 'path traversal', id: '../id' }, { name: 'separator', id: 'id/other' },
      { name: 'non-ASCII', id: 'מזהה' }, { name: 'too long', id: 'x'.repeat(129) },
    ])('rejects an invalid $name id', async ({ id }) => {
      await json(await run(id), 400)
      expectNoReads()
    })

    it.each([
      'offset=-1', 'offset=0.5', 'offset=100001', 'offset=NaN', 'offset=Infinity',
      'limit=0', 'limit=-1', 'limit=1.5', 'limit=101', 'limit=abc', 'limit=Infinity', 'limit=',
    ])('rejects invalid paging: %s', async query => {
      await json(await run(undefined, `?${query}`), 400)
      expectNoReads()
    })
  })

  it('trims legal ids and accepts the inclusive id and paging boundaries', async () => {
    const id = 'a'.repeat(126) + '_1'
    candidates = [candidate(id)]
    positions = [position(id)]
    await json(await postAiMatch(requestBody({ candidateId: ` ${id} `, positionId: ` ${id} ` })))
    const forward = await json(await candidateRequest(` ${id} `, '?offset=100000&limit=100'))
    const reverse = await json(await positionRequest(` ${id} `, '?offset=100000&limit=100'))
    expect(forward).toMatchObject({ positions: [], offset: 100000, limit: 100, hasMore: false })
    expect(reverse).toMatchObject({ candidates: [], offset: 100000, limit: 100, hasMore: false })
    expect(mocks.candidateFindUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id } }))
    expect(mocks.positionFindUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id } }))
  })
})

describe('missing records', () => {
  it.each(routes.slice(0, 2))('$name returns 404 for a missing candidate without reading positions', async route => {
    candidates = []
    expect(await json(await route.run(), 404)).toEqual({ error: expect.any(String) })
    expect(mocks.positionFindMany).not.toHaveBeenCalled()
    expect(mocks.positionFindUnique).not.toHaveBeenCalled()
  })

  it('the shared candidate scan returns null for a missing candidate', async () => {
    candidates = []
    expect(await getCandidateMatchScan('missing')).toBeNull()
    expect(mocks.positionFindMany).not.toHaveBeenCalled()
  })

  it.each(['missing', 'inactive', 'closed'])('POST single-job matching returns 404 for a %s job', async state => {
    positions = state === 'missing' ? [] : [position('position-1', state === 'inactive' ? { active: false } : { closedAt: fixedDate })]
    await json(await postAiMatch(requestBody({ candidateId: 'candidate-1', positionId: 'position-1' })), 404)
    expectOpenPositionScan('position-1')
  })

  it('reverse matching returns 404 for a missing job without reading candidates', async () => {
    positions = []
    await json(await positionRequest(), 404)
    expect(mocks.candidateFindUnique).not.toHaveBeenCalled()
    expect(mocks.candidateFindMany).not.toHaveBeenCalled()
  })
})

describe('complete forward scans and response paging', () => {
  it('the shared service scans every open job, including the highest match at the end', async () => {
    const expectedIds = seedOpenJobs()
    const scan = await getCandidateMatchScan('candidate-1')
    expect(scan).not.toBeNull()
    expect(scan!.totalScanned).toBe(139)
    expect(scan!.scored).toHaveLength(139)
    expect(scan!.suggested.map(item => item.position.id)).toEqual(expectedIds)
    expectOpenPositionScan()
  })

  it('POST lists every suggested open job without an arbitrary top-N cap', async () => {
    const expectedIds = seedOpenJobs()
    const body = await json(await postAiMatch(requestBody({ candidateId: 'candidate-1' })))
    expect(body).toMatchObject({ totalScanned: 139, notRelevant: 2, scanComplete: true, analysisMode: 'local-evidence', aiAnalyzed: 0 })
    expect(body.matches.map((item: { id: string }) => item.id)).toEqual(expectedIds)
    expectOpenPositionScan()
  })

  it.each([
    { offset: 0, limit: 20, hasMore: true },
    { offset: 135, limit: 2, hasMore: false },
    { offset: 137, limit: 2, hasMore: false },
  ])('pages display results, not the scan: offset=$offset limit=$limit', async ({ offset, limit, hasMore }) => {
    const expectedIds = seedOpenJobs()
    const body = await json(await candidateRequest('candidate-1', `?offset=${offset}&limit=${limit}`))
    expect(body).toMatchObject({ totalCount: 137, totalScanned: 139, scanComplete: true, offset, limit, hasMore })
    expect(body.positions.map((item: { id: string }) => item.id)).toEqual(expectedIds.slice(offset, offset + limit))
    expectOpenPositionScan()
  })

  it('best-matches scans all open positions while omitting groups with no suggestions', async () => {
    const expectedIds = seedOpenJobs()
    const body = await json(await getBestMatches())
    expect(body).toMatchObject({ success: true, totalPositions: 139, positionsWithMatches: 137, totalScanned: 1, scanComplete: true })
    expect(body.positions.map((group: { position: { id: string } }) => group.position.id).sort()).toEqual([...expectedIds].sort())
    expectOpenPositionScan()
  })
})

describe('selector-backed compatibility fields and real shared scores', () => {
  it.each(['POST', 'GET'])('%s preserves job details and distinguishes application/employer blocking flags', async method => {
    candidates = [candidate('candidate-1', {
      currentCompany: '  Synthetic   previous employer  ', applications: [application('position-applied', 'employer-applied')],
    })]
    const appliedEmployer = { id: 'employer-applied', name: 'Synthetic applied employer', email: 'applied@example.test' }
    positions = [
      position('position-applied', { employerId: appliedEmployer.id, employer: appliedEmployer }),
      position('position-sibling', { employerId: appliedEmployer.id, employer: appliedEmployer }),
      position('position-previous', { employerId: 'employer-previous', employer: { id: 'employer-previous', name: 'Synthetic previous employer', email: null } }),
      position('position-clear'),
    ]
    const body = await json(await (method === 'POST' ? postAiMatch(requestBody({ candidateId: 'candidate-1' })) : candidateRequest()))
    const items: Array<Record<string, unknown>> = method === 'POST' ? body.matches : body.positions
    expect(items).toHaveLength(4)
    const flags = [
      { id: 'position-applied', hasApplied: true, blockedByApplication: true, blockedByPreviousEmployer: false, isBlocked: true },
      { id: 'position-sibling', hasApplied: false, blockedByApplication: true, blockedByPreviousEmployer: false, isBlocked: true },
      { id: 'position-previous', hasApplied: false, blockedByApplication: false, blockedByPreviousEmployer: true, isBlocked: true },
      { id: 'position-clear', hasApplied: false, blockedByApplication: false, blockedByPreviousEmployer: false, isBlocked: false },
    ]
    for (const expected of flags) expect(items.find(item => item.id === expected.id)).toMatchObject(expected)
    const clear = items.find(item => item.id === 'position-clear')!
    const source = position('position-clear')
    expect(clear).toMatchObject({
      positionId: source.id, positionTitle: source.title, employerName: source.employer.name,
      description: source.description, requirements: source.requirements, salaryRange: source.salaryRange,
      employmentType: source.employmentType, workHours: source.workHours, benefits: source.benefits,
      transportation: source.transportation, openings: source.openings, contactName: source.contactName,
      keywords: source.keywords, createdAt: fixedDate.toISOString(), tags: source.tags,
      employer: { id: 'employer-1', name: 'Synthetic employer', email: 'employer@example.test' },
      matchingTags: source.tags,
    })
    expect(clear).not.toHaveProperty('internalNotes')
    expect(clear.employer).not.toHaveProperty('internalNotes')
    if (method === 'GET') {
      expect(body.candidateTags).toEqual(candidates[0].tags)
      expect(body.previousCompanies).toEqual([candidates[0].currentCompany])
    }
  })

  it('all four routes and the service preserve the same unmocked core score and evidence', async () => {
    const expected = evaluateCandidatePosition(candidate(), position())
    // השעות ואופן ההגעה נקראים גם הם; מידע חסר אינו אישור לזמינות.
    expect(expected.score).toBe(88)
    expect(expected.status).toBe('review')
    const scan = await getCandidateMatchScan('candidate-1')
    expect(scan!.scored[0].match).toEqual(expected)

    const single = await json(await postAiMatch(requestBody({ candidateId: 'candidate-1', positionId: 'position-1' })))
    const forwardPost = await json(await postAiMatch(requestBody({ candidateId: 'candidate-1' })))
    const forwardGet = await json(await candidateRequest())
    const reverse = await json(await positionRequest())
    const best = await json(await getBestMatches())
    for (const match of [single, forwardPost.matches[0], forwardGet.positions[0], reverse.candidates[0], best.positions[0].candidates[0]]) {
      expect(match).toMatchObject({
        score: expected.score, matchScore: expected.score, matchStatus: expected.status,
        strengths: expected.strengths, weaknesses: expected.weaknesses, shouldProceed: expected.shouldProceed,
        evidence: expected.evidence, requirementChecks: expected.requirements, coverage: expected.coverage,
        locationDetails: expected.location, confidence: expected.confidence, engineVersion: MATCHING_ENGINE_VERSION,
        aiAnalyzed: false,
        scoreBreakdown: { ...expected.breakdown, professional: expected.score - expected.breakdown.location, professionalMaxPossible: 85, geminiAI: 0, geminiMaxPossible: 0, geminiAnalyzed: false },
      })
      const parts = match.scoreBreakdown
      expect(parts.role + parts.skills + parts.requirements + parts.location).toBe(match.score)
    }
    for (const match of [reverse.candidates[0], best.positions[0].candidates[0]]) {
      expect(match).toMatchObject({ alternatePhone: 'TEST-ALTERNATE-PHONE', phone: 'TEST-PRIMARY-PHONE', email: 'candidate@example.test', matchingTags: [candidate().tags[0]] })
      expect(match).not.toHaveProperty('resume')
      expect(match).not.toHaveProperty('skills')
      expect(match).not.toHaveProperty('internalNotes')
    }
    expect(reverse.candidates[0].whySuitable).toEqual(expected.strengths)
    expect(Array.isArray(reverse.candidates[0].whySuitable)).toBe(true)
    expect(reverse.candidates[0].whySuitable.every((value: unknown) => typeof value === 'string')).toBe(true)
    expect(best.positions[0].candidates[0]).not.toHaveProperty('applications')
    expect(forwardGet).toMatchObject({ offset: 0, limit: 20 })
    expect(reverse).toMatchObject({ offset: 0, limit: 100, aiPowered: false, geminiAnalyzed: 0 })
  })
})

describe('reverse cursor scans beyond 500 candidates', () => {
  it.each([
    { offset: 0, limit: 3, hasMore: true },
    { offset: 523, limit: 3, hasMore: false },
    { offset: 526, limit: 3, hasMore: false },
  ])('ranks every page before returning offset=$offset limit=$limit', async ({ offset, limit, hasMore }) => {
    const expectedIds = seedCandidatePages()
    const body = await json(await positionRequest('position-1', `?offset=${offset}&limit=${limit}`))
    expect(body).toMatchObject({ totalCount: 526, totalScanned: 551, totalSearched: 551, scanComplete: true, offset, limit, hasMore })
    expect(body.candidates.map((item: { id: string }) => item.id)).toEqual(expectedIds.slice(offset, offset + limit))
    expectCompleteCursorScan(551, 'position-1')
    for (const match of body.candidates) {
      expect(match.whySuitable).toEqual(match.strengths)
      expect(Array.isArray(match.whySuitable)).toBe(true)
      expect(match.alternatePhone).toBe('TEST-ALTERNATE-PHONE')
    }
    if (offset === 0) {
      expect(body.candidates[1]).toMatchObject({ id: 'candidate-0000', hasApplied: true, applications: [{ id: 'application-position-1', status: 'REJECTED' }] })
      expect(body.candidates[2]).toMatchObject({ id: 'candidate-0001', hasApplied: false, applications: [] })
    }
  })

  it('the shared reverse service also scans beyond the returned top-N window', async () => {
    seedCandidatePages()
    const result = await scanMatchingCandidates(position(), 'position-1', 524, 10)
    expect(result).toMatchObject({ totalCount: 526, totalScanned: 551, totalSearched: 551, hasMore: false, scanComplete: true })
    expect(result.candidates.map(item => item.id)).toEqual(['candidate-0523', 'candidate-0524'])
    expectCompleteCursorScan(551, 'position-1')
  })

  it.each([0, 50, 100])('terminates an exact %i-candidate page boundary with an empty final read', async count => {
    candidates = Array.from({ length: count }, (_, index) => candidate(`candidate-${String(index).padStart(4, '0')}`))
    const body = await json(await positionRequest())
    expect(body).toMatchObject({ totalCount: count, totalScanned: count, totalSearched: count, hasMore: false, scanComplete: true })
    expect(body.candidates).toHaveLength(count)
    expectCompleteCursorScan(count, 'position-1')
    expect(candidatePageIds.at(-1)).toEqual([])
  })
})

describe('best-matches full candidate scan and canonical status', () => {
  it('counts all matches beyond 500, filters current statuses, and retains only the best 20', async () => {
    const expectedIds = seedCandidatePages()
    // הבדיקה הזו מבודדת סטטוסים; הגשות במצב פעיל חייבות להיבדק מתוך select אמיתי.
    candidates[0].applications = []
    candidates[1].applications = []
    candidates.push(
      candidate('candidate-excluded-employed', { employmentStatus: 'EMPLOYED' }),
      candidate('candidate-excluded-hired-date', { hiredAt: fixedDate }),
      candidate('candidate-excluded-hired-app', { applications: [application('position-1', 'employer-1', 'HIRED')] }),
      candidate('candidate-excluded-accepted-app', { applications: [application('position-1', 'employer-1', 'ACCEPTED')] }),
      candidate('candidate-excluded-in-process', { employmentStatus: 'IN_PROCESS' }),
      candidate('candidate-excluded-assigned', { inProcessPositionId: 'position-other' }),
      candidate('candidate-excluded-active-app', { applications: [application('position-other', 'employer-1', 'NEW')] }),
      candidate('candidate-rejected-state', { employmentStatus: 'REJECTED' }),
      candidate('candidate-rejected-app', { applications: [application('position-other')] }),
    )
    const body = await json(await getBestMatches())
    expect(body).toMatchObject({ success: true, totalPositions: 1, positionsWithMatches: 1, totalScanned: 560, totalCandidatesNotInProcess: 553, scanComplete: true })
    expect(body.positions[0].totalMatches).toBe(528)
    const results = body.positions[0].candidates
    expect(results).toHaveLength(20)
    expect(results.map((item: { id: string }) => item.id)).toEqual([
      'candidate-0550', 'candidate-rejected-app', 'candidate-rejected-state', ...expectedIds.slice(1, 18),
    ])
    expect(results.every((item: { id: string }) => !item.id.startsWith('candidate-excluded'))).toBe(true)
    expectCompleteCursorScan(560)
    expect(mocks.candidateFindMany.mock.calls[0][0].select).toMatchObject({ hiredAt: true, employmentStatus: true, inProcessPositionId: true })
  })

  it('returns an empty successful response and skips candidates when no jobs are open', async () => {
    positions = [position('inactive', { active: false }), position('closed', { closedAt: fixedDate })]
    const body = await json(await getBestMatches())
    expect(body).toMatchObject({ success: true, positions: [], totalPositions: 0, positionsWithMatches: 0, totalScanned: 0, scanComplete: true })
    expect(mocks.candidateFindMany).not.toHaveBeenCalled()
    expectOpenPositionScan()
  })
})

describe('partial scan failures are not successful empty or incomplete results', () => {
  it.each(routes.slice(0, 2))('$name handles a position read failure after loading the candidate', async route => {
    mocks.positionFindMany.mockRejectedValueOnce(new Error(diagnosticMarker))
    const body = await json(await route.run(), 500)
    expect(body).toEqual({ error: expect.any(String) })
    expect(JSON.stringify(body)).not.toContain(diagnosticMarker)
    expect(console.error).toHaveBeenCalledExactlyOnceWith(route.log)
    expect(mocks.candidateFindUnique).toHaveBeenCalledTimes(1)
  })

  it.each(routes.slice(2))('$name fails the request if a later cursor page fails', async route => {
    seedCandidatePages()
    mocks.candidateFindMany.mockImplementationOnce(readCandidates).mockRejectedValueOnce(new Error(diagnosticMarker))
    const body = await json(await route.run(), 500)
    expect(body).toEqual({ error: expect.any(String) })
    expect(JSON.stringify(body)).not.toContain(diagnosticMarker)
    expect(mocks.candidateFindMany).toHaveBeenCalledTimes(2)
    expect(console.error).toHaveBeenCalledExactlyOnceWith(route.log)
  })
})

describe('shared in-memory request limit', () => {
  it('allows 30, blocks all routes before reads, and expires exactly after 60 seconds', async () => {
    const startedAt = Date.now()
    const clock = vi.spyOn(Date, 'now').mockReturnValue(startedAt)
    for (let index = 0; index < 30; index++) {
      expect(await authorizeMatchingRequest()).toEqual({ user: { id: userId } })
    }
    for (const route of routes) {
      const response = await route.run()
      expect(await json(response, 429)).toMatchObject({ code: 'RATE_LIMIT', error: expect.any(String) })
      expect(response.headers.get('Retry-After')).toBe('60')
    }
    expectNoReads()
    clock.mockReturnValue(startedAt + 59_999)
    await json(await candidateRequest(), 429)
    expectNoReads()
    clock.mockReturnValue(startedAt + 60_000)
    await json(await candidateRequest())
    expect(mocks.candidateFindUnique).toHaveBeenCalledTimes(1)
    expect(mocks.requireApiUser).toHaveBeenCalledTimes(36)
  })

  it('does not share one authenticated user quota with another user or bypass a later denial', async () => {
    for (let index = 0; index < 30; index++) await authorizeMatchingRequest()
    await json(await getBestMatches(), 429)
    expectNoReads()

    mocks.requireApiUser.mockResolvedValueOnce({ response: Response.json({ error: 'Forbidden' }, {
      status: 403, headers: { 'Cache-Control': 'private, no-store' },
    }) })
    await json(await getBestMatches(), 403)
    expectNoReads()

    mocks.requireApiUser.mockResolvedValue({ user: { id: `matching-route-test-user-${++userSequence}` } })
    await json(await getBestMatches())
    expect(mocks.positionFindMany).toHaveBeenCalledTimes(1)
  })
})