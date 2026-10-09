import { NextRequest, NextResponse } from "next/server"
import { requireApiUser } from "@/lib/api-authorization"
import { prisma } from "@/lib/prisma"
import { deserializeParsedCandidate } from "@/lib/email-proposals"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const STATUSES = ["PENDING", "APPROVED", "REJECTED", "FAILED", "ALL"] as const

export async function GET(request: NextRequest) {
  try {
    const authorization = await requireApiUser()
    if ("response" in authorization) return authorization.response

    const status = request.nextUrl.searchParams.get("status") || "PENDING"
    if (!STATUSES.includes(status as typeof STATUSES[number])) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }
    const where = status === "ALL" ? {} : { status }

    const [imports, proposals] = await Promise.all([
      prisma.gmailCandidateImport.findMany({ where, orderBy: { createdAt: "desc" }, take: 100 }),
      status === "FAILED"
        ? Promise.resolve([])
        : prisma.gmailInterviewProposal.findMany({ where, orderBy: { createdAt: "desc" }, take: 100 }),
    ])

    const candidateIds = Array.from(new Set(proposals.map((item) => item.candidateId)))
    const positionIds = Array.from(new Set(proposals.map((item) => item.positionId).filter((id): id is string => Boolean(id))))
    const [candidates, positions] = await Promise.all([
      candidateIds.length
        ? prisma.candidate.findMany({ where: { id: { in: candidateIds } }, select: { id: true, name: true, phone: true } })
        : Promise.resolve([]),
      positionIds.length
        ? prisma.position.findMany({ where: { id: { in: positionIds } }, select: { id: true, title: true } })
        : Promise.resolve([]),
    ])
    const candidateById = new Map(candidates.map((item) => [item.id, item]))
    const positionById = new Map(positions.map((item) => [item.id, item]))

    return NextResponse.json({
      candidateImports: imports.map((item) => ({
        id: item.id,
        status: item.status,
        fileName: item.fileName,
        sourceSender: item.sourceSender,
        sourceSubject: item.sourceSubject,
        errorMessage: item.errorMessage,
        createdAt: item.createdAt,
        reviewedAt: item.reviewedAt,
        candidateId: item.candidateId,
        parsed: deserializeParsedCandidate(item.parsedCandidate),
      })),
      interviewProposals: proposals.map((item) => ({
        id: item.id,
        status: item.status,
        proposedAt: item.proposedAt,
        location: item.location,
        subject: item.snippet,
        sourceSender: item.sourceSender,
        createdAt: item.createdAt,
        reviewedAt: item.reviewedAt,
        interviewId: item.interviewId,
        candidate: candidateById.get(item.candidateId) || null,
        position: item.positionId ? positionById.get(item.positionId) || null : null,
      })),
    }, { headers: { "Cache-Control": "private, no-store" } })
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : ""
    if (code === "P2021") {
      return NextResponse.json(
        { error: "טבלאות ההצעות עדיין לא נוצרו במסד. יש להפעיל מחדש את האתר כדי להריץ את המיגרציה.", candidateImports: [], interviewProposals: [] },
        { status: 503 },
      )
    }
    console.error("[email-proposals] Error")
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
