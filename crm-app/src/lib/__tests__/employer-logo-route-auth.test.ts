import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { getServerSession } = vi.hoisted(() => ({ getServerSession: vi.fn() }))

vi.mock('next-auth', () => ({ getServerSession }))
vi.mock('@/app/api/auth/[...nextauth]/route', () => ({ authOptions: {} }))

import { GET } from '@/app/api/employers/logo/[filename]/route'

const filename = '550e8400-e29b-41d4-a716-446655440000.png'
const request = new NextRequest(`https://crm.example.com/api/employers/logo/${filename}`)
const context = { params: Promise.resolve({ filename }) }

describe('employer logo route authorization', () => {
  beforeEach(() => {
    getServerSession.mockReset()
  })

  it('blocks anonymous requests', async () => {
    getServerSession.mockResolvedValue(null)

    const response = await GET(request, context)

    expect(response.status).toBe(401)
  })

  it('accepts an authenticated legacy session without a user id', async () => {
    getServerSession.mockResolvedValue({ user: { email: 'office@example.com' } })

    const response = await GET(request, context)

    expect(response.status).toBe(404)
  })
})