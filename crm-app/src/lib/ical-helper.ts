/**
 * Generate iCalendar (.ics) files for Outlook / universal calendar compatibility
 */
import ical, { ICalAlarmType } from "ical-generator"

export interface ICalEventInput {
  uid: string
  title: string
  description?: string
  startTime: Date
  durationMinutes: number
  location?: string
  organizerName: string
  organizerEmail: string
  attendees: { name: string; email: string }[]
}

export function generateICalString(input: ICalEventInput): string {
  const cal = ical({ name: "TWENTY2CRM" })

  const endTime = new Date(input.startTime.getTime() + input.durationMinutes * 60 * 1000)

  const event = cal.createEvent({
    summary: input.title,
    description: input.description,
    start: input.startTime,
    end: endTime,
    location: input.location,
    organizer: {
      name: input.organizerName,
      email: input.organizerEmail,
    },
  })

  event.id(input.uid)

  for (const a of input.attendees) {
    event.createAttendee({ name: a.name, email: a.email, rsvp: true })
  }

  event.createAlarm({ type: ICalAlarmType.audio, triggerBefore: 60 * 60 })
  event.createAlarm({ type: ICalAlarmType.audio, triggerBefore: 15 * 60 })

  return cal.toString()
}
