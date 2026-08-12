/**
 * Google Calendar API wrapper
 * Uses googleapis package (already installed) with OAuth2
 */
import { google } from "googleapis"

const CLIENT_ID     = process.env.GMAIL_CLIENT_ID!
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET!
const REDIRECT_URI  = process.env.GOOGLE_CALENDAR_REDIRECT_URI ||
                      `${process.env.NEXTAUTH_URL}/api/calendar/callback`

export function createOAuth2Client(refreshToken?: string) {
  const auth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI)
  if (refreshToken) {
    auth.setCredentials({ refresh_token: refreshToken })
  }
  return auth
}

/** URL to redirect users to for Google Calendar consent */
export function getCalendarAuthUrl(): string {
  const auth = createOAuth2Client()
  return auth.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
  })
}

/** Exchange auth code for refresh token */
export async function exchangeCodeForTokens(code: string): Promise<{
  refreshToken: string
  email: string
}> {
  const auth = createOAuth2Client()
  const { tokens } = await auth.getToken(code)
  auth.setCredentials(tokens)

  const oauth2 = google.oauth2({ version: "v2", auth })
  const { data } = await oauth2.userinfo.get()

  return {
    refreshToken: tokens.refresh_token!,
    email: data.email!,
  }
}

export interface CalendarEventInput {
  title: string
  description?: string
  startTime: Date
  durationMinutes: number
  location?: string
  meetingUrl?: string
  attendeeEmails: string[]  // candidate + recruiter emails
  organizerEmail: string
}

/** Create a Google Calendar event and return the event ID */
export async function createCalendarEvent(
  refreshToken: string,
  input: CalendarEventInput
): Promise<string> {
  const auth = createOAuth2Client(refreshToken)
  const calendar = google.calendar({ version: "v3", auth })

  const endTime = new Date(input.startTime.getTime() + input.durationMinutes * 60 * 1000)

  const conferenceData = input.meetingUrl
    ? undefined
    : {
        createRequest: {
          requestId: `twenty2crm-${Date.now()}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      }

  const event = await calendar.events.insert({
    calendarId: "primary",
    conferenceDataVersion: input.meetingUrl ? undefined : 1,
    sendUpdates: "all",  // Google sends email invites to attendees automatically
    requestBody: {
      summary: input.title,
      description: input.description,
      location: input.meetingUrl || input.location,
      start: { dateTime: input.startTime.toISOString(), timeZone: "Asia/Jerusalem" },
      end:   { dateTime: endTime.toISOString(),          timeZone: "Asia/Jerusalem" },
      attendees: input.attendeeEmails.map(email => ({ email })),
      conferenceData,
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 60 },
          { method: "popup", minutes: 15 },
        ],
      },
    },
  })

  return event.data.id!
}

/** Update an existing Google Calendar event */
export async function updateCalendarEvent(
  refreshToken: string,
  eventId: string,
  input: Partial<CalendarEventInput>
): Promise<void> {
  const auth = createOAuth2Client(refreshToken)
  const calendar = google.calendar({ version: "v3", auth })

  const patch: any = {}

  if (input.title)    patch.summary  = input.title
  if (input.location) patch.location = input.meetingUrl || input.location
  if (input.description) patch.description = input.description

  if (input.startTime) {
    const end = new Date(
      input.startTime.getTime() + (input.durationMinutes || 60) * 60 * 1000
    )
    patch.start = { dateTime: input.startTime.toISOString(), timeZone: "Asia/Jerusalem" }
    patch.end   = { dateTime: end.toISOString(),             timeZone: "Asia/Jerusalem" }
  }

  if (input.attendeeEmails) {
    patch.attendees = input.attendeeEmails.map(email => ({ email }))
  }

  await calendar.events.patch({
    calendarId: "primary",
    eventId,
    sendUpdates: "all",
    requestBody: patch,
  })
}

/** Delete / cancel a Google Calendar event */
export async function deleteCalendarEvent(
  refreshToken: string,
  eventId: string
): Promise<void> {
  const auth = createOAuth2Client(refreshToken)
  const calendar = google.calendar({ version: "v3", auth })
  await calendar.events.delete({
    calendarId: "primary",
    eventId,
    sendUpdates: "all",
  })
}

/** Check for conflicting events in a time window (freebusy API) */
export async function checkCalendarConflicts(
  refreshToken: string,
  startTime: Date,
  endTime: Date
): Promise<boolean> {
  try {
    const auth = createOAuth2Client(refreshToken)
    const calendar = google.calendar({ version: "v3", auth })

    const { data } = await calendar.freebusy.query({
      requestBody: {
        timeMin: startTime.toISOString(),
        timeMax: endTime.toISOString(),
        timeZone: "Asia/Jerusalem",
        items: [{ id: "primary" }],
      },
    })

    const busy = data.calendars?.["primary"]?.busy || []
    return busy.length > 0
  } catch {
    return false  // fail-open: don't block scheduling on freebusy errors
  }
}
