import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireApiUser } from "@/lib/api-authorization"
import { prisma } from "@/lib/prisma"

const querySchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "ALL"]).default("PENDING"),
})

export async function GET(request: NextRequest) {
  try {
    const authorization = await requireApiUser()
    if ("response" in authorization) return authorization.response

    const parsed = querySchema.safeParse({ status: request.nextUrl.searchParams.get("status") || "PENDING" })
    if (!parsed.success) return NextResponse.json({ error: "Invalid status" }, { status: 400 })

    const updates = await prisma.candidateUpdate.findMany({
      where: parsed.data.status === "ALL" ? undefined : { status: parsed.data.status },
      select: {
        id: true,
        type: true,
        status: true,
        source: true,
        title: true,
        summary: true,
        proposedStatus: true,
        sourceSender: true,
        createdAt: true,
        reviewedAt: true,
        candidate: { select: { id: true, name: true } },
        position: { select: { id: true, title: true, employer: { select: { name: true } } } },
        uploader: { select: { id: true, name: true } },
        recruiter: { select: { id: true, name: true } },
        reviewedBy: { select: { id: true, name: true } },
        mailbox: { select: { email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    })

    return NextResponse.json({ updates }, { headers: { "Cache-Control": "private, no-store" } })
  } catch (error) {
    console.error("Candidate updates list failed:", error)
    return NextResponse.json({ error: "Failed to load updates" }, { status: 500 })
  }
}