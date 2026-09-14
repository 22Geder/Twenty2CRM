/**
 * Google Calendar API wrapper
 * Uses googleapis package (already installed) with OAuth2
 */
import { google } from "googleapis"

function readServerEnv(name: string): string | undefined {
  return process.env[name]?.trim()
}

export function isCalendarOAuthConfigured(): boolean {
  return Boolean(readServerEnv("GMAIL_CLIENT_ID") && readServerEnv("GMAIL_CLIENT_SECRET"))
}

export function getCalendarAppOrigin(): string | undefined {
  const configuredUrl = readServerEnv("GOOGLE_CALENDAR_REDIRECT_URI") || readServerEnv("NEXTAUTH_URL")
  if (!configuredUrl) return undefined

  try {
    return new URL(configuredUrl).origin
  } catch {
    return undefined
  }
}

function getOAuthConfig() {
  const clientId = readServerEnv("GMAIL_CLIENT_ID")
  const clientSecret = readServerEnv("GMAIL_CLIENT_SECRET")
  const redirectUri = readServerEnv("GOOGLE_CALENDAR_REDIRECT_URI") ||
    `${readServerEnv("NEXTAUTH_URL")}/api/calendar/callback`

  if (!clientId || !clientSecret) {
    throw new Error("Google Calendar OAuth is not configured")
  }

  return { clientId, clientSecret, redirectUri }
}

export function createOAuth2Client(refreshToken?: string) {
  const { clientId, clientSecret, redirectUri } = getOAuthConfig()
  const auth = new google.auth.OAuth2(clientId, clientSecret, redirectUri)
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

export interface AllDayCalendarEventInput {
  title: string
  description?: string
  date: Date
  attendeeEmails?: string[]
}

export interface CalendarListEvent {
  id: string
  title: string
  start: string
  end: string
  allDay: boolean
  location?: string
  description?: string
  meetingUrl?: string
  htmlLink?: string
  colorId?: string
  attendeeEmails?: string[]
}

export interface TaggedCalendarEventInput extends CalendarEventInput {
  privateKey: string
}

function toCalendarDate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jerusalem",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}

/** Create an all-day event, used for candidates marked as hired. */
export async function createAllDayCalendarEvent(
  refreshToken: string,
  input: AllDayCalendarEventInput
): Promise<string> {
  const auth = createOAuth2Client(refreshToken)
  const calendar = google.calendar({ version: "v3", auth })
  const startDate = toCalendarDate(input.date)
  const endDate = new Date(`${startDate}T12:00:00+03:00`)
  endDate.setDate(endDate.getDate() + 1)

  const event = await calendar.events.insert({
    calendarId: "primary",
    sendUpdates: input.attendeeEmails?.length ? "all" : "none",
    requestBody: {
      summary: input.title,
      description: input.description,
      start: { date: startDate },
      end: { date: toCalendarDate(endDate) },
      attendees: input.attendeeEmails?.map(email => ({ email })),
      reminders: {
        useDefault: false,
        overrides: [{ method: "popup", minutes: 9 * 60 }],
      },
    },
  })

  return event.data.id!
}

/** List events for an authenticated calendar without exposing OAuth credentials. */
export async function listCalendarEvents(
  refreshToken: string,
  timeMin: Date,
  timeMax: Date
): Promise<CalendarListEvent[]> {
  const auth = createOAuth2Client(refreshToken)
  const calendar = google.calendar({ version: "v3", auth })
  const response = await calendar.events.list({
    calendarId: "primary",
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 250,
  })

  return (response.data.items || []).flatMap(event => {
    const start = event.start?.dateTime || event.start?.date
    const end = event.end?.dateTime || event.end?.date
    if (!event.id || !start || !end || event.status === "cancelled") return []
    return [{
      id: event.id,
      title: event.summary || "ללא כותרת",
      start,
      end,
      allDay: Boolean(event.start?.date),
      location: event.location || undefined,
      description: event.description || undefined,
      meetingUrl: event.hangoutLink || event.conferenceData?.entryPoints
        ?.find(entryPoint => entryPoint.entryPointType === "video")?.uri || undefined,
      htmlLink: event.htmlLink || undefined,
      colorId: event.colorId || undefined,
      attendeeEmails: event.attendees
        ?.map(attendee => attendee.email)
        .filter((email): email is string => Boolean(email)),
    }]
  })
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

/** Create, update, or remove one CRM-owned event without creating duplicates. */
export async function syncTaggedCalendarEvent(
  refreshToken: string,
  privateKey: string,
  input: CalendarEventInput | null
): Promise<void> {
  const auth = createOAuth2Client(refreshToken)
  const calendar = google.calendar({ version: "v3", auth })
  const response = await calendar.events.list({
    calendarId: "primary",
    privateExtendedProperty: [`twenty2crmKey=${privateKey}`],
    showDeleted: false,
    maxResults: 10,
  })
  const existingEvents = (response.data.items || []).filter(event => event.id)

  if (!input) {
    await Promise.all(existingEvents.map(event => calendar.events.delete({
      calendarId: "primary",
      eventId: event.id!,
      sendUpdates: "all",
    })))
    return
  }

  const endTime = new Date(input.startTime.getTime() + input.durationMinutes * 60 * 1000)
  const requestBody = {
    summary: input.title,
    description: input.description,
    location: input.meetingUrl || input.location,
    start: { dateTime: input.startTime.toISOString(), timeZone: "Asia/Jerusalem" },
    end: { dateTime: endTime.toISOString(), timeZone: "Asia/Jerusalem" },
    attendees: input.attendeeEmails.map(email => ({ email })),
    extendedProperties: {
      private: { twenty2crmKey: privateKey },
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: "email", minutes: 60 },
        { method: "popup", minutes: 15 },
      ],
    },
  }

  const primaryEvent = existingEvents[0]
  if (primaryEvent?.id) {
    await calendar.events.update({
      calendarId: "primary",
      eventId: primaryEvent.id,
      sendUpdates: "all",
      requestBody,
    })
    await Promise.all(existingEvents.slice(1).map(event => calendar.events.delete({
      calendarId: "primary",
      eventId: event.id!,
      sendUpdates: "all",
    })))
    return
  }

  await calendar.events.insert({
    calendarId: "primary",
    sendUpdates: "all",
    requestBody,
  })
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
