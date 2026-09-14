import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { getServerSession, findUnique } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  findUnique: vi.fn(),
}))

// אין טעינה של ספק ההתחברות או של לקוח Prisma אמיתי.
vi.mock('next-auth', () => ({ getServerSession }))
vi.mock('@/app/api/auth/[...nextauth]/route', () => ({ authOptions: {} }))
vi.mock('@/lib/prisma', () => ({ prisma: { user: { findUnique } } }))

import { requireApiUser, type ApiUser } from '../api-authorization'

const admin: ApiUser = {
  id: 'session-user',
  name: 'Test Admin',
  email: 'admin@example.test',
  role: 'ADMIN',
  active: true,
  lockedAt: null,
}

describe('requireApiUser', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    getServerSession.mockResolvedValue({ user: { id: admin.id, role: 'ADMIN' } })
    findUnique.mockResolvedValue(admin)
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it.each([
    null,
    {},
    { user: null },
    { user: {} },
    { user: { email: admin.email, role: 'ADMIN' } },
    { user: { id: '' } },
    { user: { id: '   ' } },
    { user: { id: 123 } },
  ])('דורש מזהה מתוך session מאומת: %j', async (session) => {
    getServerSession.mockResolvedValue(session)

    const result = await requireApiUser('ADMIN')

    expect('response' in result).toBe(true)
    if (!('response' in result)) throw new Error('Expected authorization denial')
    expect(result.response.status).toBe(401)
    expect(await result.response.json()).toEqual({ error: 'Unauthorized' })
    expect(result.response.headers.get('Cache-Control')).toBe('private, no-store')
    expect(findUnique).not.toHaveBeenCalled()
  })

  it.each([
    null,
    { ...admin, active: false },
    { ...admin, lockedAt: new Date('2026-09-09T00:00:00.000Z') },
    { ...admin, role: 'RECRUITER' },
    { ...admin, active: undefined },
    { ...admin, lockedAt: undefined },
  ])('חוסם חשבון חסר, לא פעיל, נעול או לא מורשה לפי המצב העדכני: %j', async (user) => {
    findUnique.mockResolvedValue(user)

    const result = await requireApiUser('ADMIN')

    expect('response' in result).toBe(true)
    if (!('response' in result)) throw new Error('Expected authorization denial')
    expect(result.response.status).toBe(403)
    expect(await result.response.json()).toEqual({ error: 'Forbidden' })
    expect(result.response.headers.get('Cache-Control')).toBe('private, no-store')
  })

  it('מחזיר רק את המשתמש המאומת עם השדות הדרושים ולא נתוני התחברות', async () => {
    const result = await requireApiUser('ADMIN')

    expect(result).toEqual({ user: admin })
    expect(getServerSession).toHaveBeenCalledWith({})
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: admin.id },
      select: { id: true, name: true, email: true, role: true, active: true, lockedAt: true },
    })
  })

  it('מאפשר משתמש פעיל שאינו מנהל כשלא נדרשת הרשאת ADMIN', async () => {
    const recruiter = { ...admin, role: 'RECRUITER' }
    findUnique.mockResolvedValue(recruiter)

    expect(await requireApiUser()).toEqual({ user: recruiter })
  })

  it('מקבל קידום עדכני למנהל גם כאשר ה-JWT מכיל תפקיד ישן', async () => {
    getServerSession.mockResolvedValue({ user: { id: admin.id, role: 'RECRUITER' } })

    expect(await requireApiUser('ADMIN')).toEqual({ user: admin })
  })

  it('בודק מחדש השבתה גם אחרי בקשה שאושרה', async () => {
    expect(await requireApiUser()).toEqual({ user: admin })
    findUnique.mockResolvedValue({ ...admin, active: false })

    const result = await requireApiUser()

    expect('response' in result).toBe(true)
    if (!('response' in result)) throw new Error('Expected authorization denial')
    expect(result.response.status).toBe(403)
    expect(findUnique).toHaveBeenCalledTimes(2)
  })

  it.each(['session', 'database'])('כשל אימות נסגר ללא חשיפת פרטים: %s', async (stage) => {
    const failure = new Error('Private authentication diagnostics')
    if (stage === 'session') getServerSession.mockRejectedValue(failure)
    else findUnique.mockRejectedValue(failure)

    const result = await requireApiUser('ADMIN')

    expect('response' in result).toBe(true)
    if (!('response' in result)) throw new Error('Expected authorization denial')
    expect(result.response.status).toBe(500)
    expect(await result.response.json()).toEqual({ error: 'Internal server error' })
    expect(console.error).toHaveBeenCalledWith('[api-authorization] Authorization check failed')
    expect(console.error).toHaveBeenCalledTimes(1)
    if (stage === 'session') expect(findUnique).not.toHaveBeenCalled()
  })
})