import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

const mocks = vi.hoisted(() => ({
  requireApiUser: vi.fn(),
  transaction: vi.fn(),
  findUnique: vi.fn(),
  updateMany: vi.fn(),
  candidateUpdateMany: vi.fn(),
  candidateUpdate: vi.fn(),
  sendEmail: vi.fn(),
  addCalendarEvent: vi.fn(),
}))

vi.mock("@/lib/api-authorization", () => ({ requireApiUser: mocks.requireApiUser }))
vi.mock("@/lib/prisma", () => ({ prisma: { $transaction: mocks.transaction } }))
vi.mock("@/lib/process-notifications", () => ({ sendCandidateStatusChangeEmail: mocks.sendEmail }))
vi.mock("@/lib/hired-candidate-calendar", () => ({ addHiredCandidateToTeamCalendars: mocks.addCalendarEvent }))

import { POST } from "@/app/api/candidate-updates/[id]/review/route"

const transactionClient = {
  candidateUpdate: { findUnique: mocks.findUnique, updateMany: mocks.candidateUpdateMany },
  candidate: { update: mocks.candidateUpdate },
  application: { updateMany: mocks.updateMany },
}

function request(action: "APPROVE" | "REJECT") {
  return new NextRequest("http://localhost/api/candidate-updates/update-1/review", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  })
}

beforeEach(() => {
  vi.resetAllMocks()
  mocks.requireApiUser.mockResolvedValue({ user: { id: "user-1" } })
  mocks.transaction.mockImplementation((callback) => callback(transactionClient))
  mocks.candidateUpdateMany.mockResolvedValue({ count: 1 })
})

describe("candidate update review route", () => {
  it("rejects a proposal without changing the candidate", async () => {
    mocks.findUnique.mockResolvedValue({ id: "update-1", status: "PENDING" })

    const response = await POST(request("REJECT"), { params: Promise.resolve({ id: "update-1" }) })

    expect(response.status).toBe(200)
    expect(mocks.candidateUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "update-1", status: "PENDING" },
      data: expect.objectContaining({ status: "REJECTED" }),
    }))
    expect(mocks.candidateUpdate).not.toHaveBeenCalled()
    expect(mocks.updateMany).not.toHaveBeenCalled()
  })

  it("does not apply an already reviewed proposal", async () => {
    mocks.findUnique.mockResolvedValue({ id: "update-1", status: "APPROVED" })

    const response = await POST(request("APPROVE"), { params: Promise.resolve({ id: "update-1" }) })

    expect(response.status).toBe(409)
    expect(mocks.candidateUpdateMany).not.toHaveBeenCalled()
    expect(mocks.candidateUpdate).not.toHaveBeenCalled()
    expect(mocks.updateMany).not.toHaveBeenCalled()
  })

  it("applies an approved employed status once inside the transaction", async () => {
    mocks.findUnique.mockResolvedValue({
      id: "update-1",
      status: "PENDING",
      proposedStatus: "EMPLOYED",
      candidateId: "candidate-1",
      candidate: { id: "candidate-1", name: "ישראל ישראלי", phone: null, hiredAt: null, employmentStatus: "IN_PROCESS" },
      position: { title: "מנהל סניף", employer: { name: "חברה" } },
    })
    mocks.candidateUpdate.mockResolvedValue({
      id: "candidate-1",
      name: "ישראל ישראלי",
      phone: null,
      hiredAt: new Date("2026-09-15T08:00:00Z"),
      employmentStatus: "EMPLOYED",
    })

    const response = await POST(request("APPROVE"), { params: Promise.resolve({ id: "update-1" }) })

    expect(response.status).toBe(200)
    expect(mocks.candidateUpdate).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
      where: { id: "candidate-1" },
      data: expect.objectContaining({ employmentStatus: "EMPLOYED", inProcessPositionId: null }),
    }))
    expect(mocks.updateMany).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
      data: { status: "HIRED" },
    }))
  })
})