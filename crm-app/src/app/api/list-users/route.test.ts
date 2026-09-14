import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getServerSession, findUnique, findMany } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  findUnique: vi.fn(),
  findMany: vi.fn(),
}))

// בדיקות מבודדות: אין חיבור למסד נתונים או לספק התחברות אמיתי.
vi.mock('next-auth', () => ({ getServerSession }))
vi.mock('@/app/api/auth/[...nextauth]/route', () => ({ authOptions: {} }))
vi.mock('@/lib/prisma', () => ({ prisma: { user: { findUnique, findMany } } }))

import { GET } from './route'

describe('GET /api/list-users', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    getServerSession.mockResolvedValue({ user: { id: 'admin-id', role: 'ADMIN' } })
    findUnique.mockResolvedValue({ role: 'ADMIN', active: true, lockedAt: null })
    findMany.mockResolvedValue([])
  })

  it.each([null, {}, { user: {} }])('חוסם גישה ללא זיהוי מאומת: %j', async (session) => {
    getServerSession.mockResolvedValue(session)
    const response = await GET()
    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: 'Unauthorized' })
    expect(response.headers.get('Cache-Control')).toBe('private, no-store')
    expect(findUnique).not.toHaveBeenCalled()
    expect(findMany).not.toHaveBeenCalled()
  })

  it.each([
    null,
    { role: 'RECRUITER', active: true, lockedAt: null },
    { role: 'ADMIN', active: false, lockedAt: null },
    { role: 'ADMIN', active: true, lockedAt: new Date() },
  ])('חוסם משתמש שנמחק, הורד בדרגה, הושבת או ננעל: %j', async (user) => {
    findUnique.mockResolvedValue(user)
    const response = await GET()
    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({ error: 'Forbidden' })
    expect(findMany).not.toHaveBeenCalled()
  })

  it('מאפשר מנהל פעיל ושומר על מבנה התשובה והשדות המותרים', async () => {
    const users = [{ id: 'user-id', name: 'Test', email: 'test@example.com', role: 'RECRUITER', active: true, createdAt: '2026-09-08T00:00:00.000Z' }]
    findMany.mockResolvedValue(users)
    const response = await GET()
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ users })
    expect(response.headers.get('Cache-Control')).toBe('private, no-store')
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: 'admin-id' },
      select: { role: true, active: true, lockedAt: true },
    })
    expect(findMany).toHaveBeenCalledWith({
      select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    })
  })

  it.each(['session', 'authorization', 'query'])('נכשל בבטחה ללא חשיפת פרטי שגיאה: %s', async (stage) => {
    const failure = new Error('Sensitive internal details')
    if (stage === 'session') getServerSession.mockRejectedValue(failure)
    if (stage === 'authorization') findUnique.mockRejectedValue(failure)
    if (stage === 'query') findMany.mockRejectedValue(failure)
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const response = await GET()
      expect(response.status).toBe(500)
      expect(await response.json()).toEqual({ error: 'Internal server error' })
      expect(log).toHaveBeenCalledWith('[list-users] Failed to list users')
      if (stage !== 'query') expect(findMany).not.toHaveBeenCalled()
    } finally {
      log.mockRestore()
    }
  })
})