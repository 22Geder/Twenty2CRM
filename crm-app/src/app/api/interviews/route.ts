import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { createCalendarEvent } from "@/lib/google-calendar"
import { generateICalString } from "@/lib/ical-helper"
import nodemailer from "nodemailer"

// GET /api/interviews - קבלת כל הראיונות
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const candidateId = searchParams.get("candidateId")
    const positionId = searchParams.get("positionId")
    const fromDate = searchParams.get("fromDate")
    const toDate = searchParams.get("toDate")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    const where: any = {}

    if (status) {
      where.status = status
    }

    if (candidateId) {
      where.candidateId = candidateId
    }

    if (positionId) {
      where.positionId = positionId
    }

    if (fromDate || toDate) {
      where.scheduledAt = {}
      if (fromDate) {
        where.scheduledAt.gte = new Date(fromDate)
      }
      if (toDate) {
        where.scheduledAt.lte = new Date(toDate)
      }
    }

    const [interviews, total] = await Promise.all([
      prisma.interview.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledAt: "asc" },
        include: {
          candidate: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          position: {
            select: {
              id: true,
              title: true,
              employer: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          scheduler: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          application: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      }),
      prisma.interview.count({ where }),
    ])

    return NextResponse.json({
      interviews,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching interviews:", error)
    return NextResponse.json(
      { error: "Failed to fetch interviews" },
      { status: 500 }
    )
  }
}

// POST /api/interviews - יצירת ראיון חדש
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      type,
      scheduledAt,
      duration,
      location,
      meetingUrl,
      notes,
      applicationId,
      positionId,
      candidateId,
      schedulerId,
      status,
    } = body

    // Validation
    if (!title || !type || !scheduledAt || !applicationId || !positionId || !candidateId) {
      return NextResponse.json(
        { error: "Required fields missing" },
        { status: 400 }
      )
    }

    // Resolve scheduler: use provided ID or fall back to the current session user
    let resolvedSchedulerId = schedulerId
    if (!resolvedSchedulerId || resolvedSchedulerId === "__current_user__") {
      const sessionUser = await prisma.user.findUnique({
        where: { email: session.user?.email! },
        select: { id: true },
      })
      resolvedSchedulerId = sessionUser?.id
    }

    if (!resolvedSchedulerId) {
      return NextResponse.json(
        { error: "Scheduler user not found" },
        { status: 400 }
      )
    }

    // Verify application exists
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
    })

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      )
    }

    const interview = await prisma.interview.create({
      data: {
        title,
        type,
        scheduledAt: new Date(scheduledAt),
        duration: parseInt(duration) || 60,
        location,
        meetingUrl,
        notes,
        applicationId,
        positionId,
        candidateId,
        schedulerId: resolvedSchedulerId,
        status: status || "SCHEDULED",
      },
      include: {
        candidate: true,
        position: {
          include: {
            employer: true,
          },
        },
        scheduler: true,
        application: true,
      },
    })

    // 📅 Google Calendar event creation (non-blocking)
    try {
      const scheduler = await prisma.user.findUnique({
        where: { id: resolvedSchedulerId },
        select: { googleCalendarRefreshToken: true, email: true, name: true },
      })

      if (scheduler?.googleCalendarRefreshToken) {
        const attendeeEmails = [
          scheduler.email,
          interview.candidate?.email,
        ].filter((e): e is string => Boolean(e))

        const eventId = await createCalendarEvent(scheduler.googleCalendarRefreshToken, {
          title: interview.title,
          description: [
            `ראיון עם: ${interview.candidate?.name}`,
            `תפקיד: ${interview.position?.title}`,
            interview.notes ? `הערות: ${interview.notes}` : "",
          ].filter(Boolean).join("\n"),
          startTime: interview.scheduledAt,
          durationMinutes: interview.duration,
          location: interview.location ?? undefined,
          meetingUrl: interview.meetingUrl ?? undefined,
          attendeeEmails,
          organizerEmail: scheduler.email,
        })

        // Save the Google Calendar event ID
        await prisma.interview.update({
          where: { id: interview.id },
          data: { googleCalendarEventId: eventId },
        })

        // Also send .ics for Outlook compatibility if candidate has email
        if (interview.candidate?.email && process.env.SMTP_HOST) {
          const icsContent = generateICalString({
            uid: interview.id,
            title: interview.title,
            description: `ראיון עם ${interview.candidate.name}`,
            startTime: interview.scheduledAt,
            durationMinutes: interview.duration,
            location: interview.meetingUrl ?? interview.location ?? undefined,
            organizerName: scheduler.name,
            organizerEmail: scheduler.email,
            attendees: [
              { name: interview.candidate.name, email: interview.candidate.email },
              { name: scheduler.name, email: scheduler.email },
            ],
          })

          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || "587"),
            secure: process.env.SMTP_SECURE === "true",
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
          })

          await transporter.sendMail({
            from: `"${process.env.SMTP_FROM_NAME || "TWENTY2CRM"}" <${process.env.SMTP_USER}>`,
            to: interview.candidate.email,
            subject: `זימון ראיון: ${interview.title}`,
            html: `<div dir="rtl">
              <h2>זומנת לראיון!</h2>
              <p><strong>תאריך:</strong> ${new Date(scheduledAt).toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" })}</p>
              <p><strong>משרה:</strong> ${interview.position?.title}</p>
              ${interview.meetingUrl ? `<p><strong>קישור:</strong> <a href="${interview.meetingUrl}">${interview.meetingUrl}</a></p>` : ""}
              ${interview.location ? `<p><strong>מיקום:</strong> ${interview.location}</p>` : ""}
              <p>הקובץ המצורף הוא זימון יומן (.ics) — פותח ב-Outlook וב-Google Calendar.</p>
            </div>`,
            attachments: [
              {
                filename: "interview.ics",
                content: icsContent,
                contentType: "text/calendar;method=REQUEST",
              },
            ],
          })
        }
      }
    } catch (calErr) {
      console.error("Calendar sync error (non-fatal):", calErr)
    }

    return NextResponse.json(interview, { status: 201 })
  } catch (error) {
    console.error("Error creating interview:", error)
    return NextResponse.json(
      { error: "Failed to create interview" },
      { status: 500 }
    )
  }
}
