type InterviewReminderInput = {
  candidateName: string
  phone: string | null
  scheduledAt: string | Date
  positionTitle: string
  employerName?: string | null
  location?: string | null
}

export function getLocalDayKey(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function getLocalDayRange(date = new Date()) {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { start, end }
}

export function normalizeIsraeliPhoneForWhatsApp(phone: string | null): string | null {
  if (!phone) return null

  const digits = phone.replace(/\D/g, "")
  if (/^05\d{8}$/.test(digits)) return `972${digits.slice(1)}`
  if (/^9725\d{8}$/.test(digits)) return digits
  return null
}

export function buildInterviewReminderMessage(input: InterviewReminderInput): string {
  const time = new Date(input.scheduledAt).toLocaleTimeString("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
  })
  const employer = input.employerName ? ` בחברת ${input.employerName}` : ""
  const location = input.location ? `\nמיקום: ${input.location}` : ""

  return `היי ${input.candidateName}, תזכורת לראיון העבודה שלך היום בשעה ${time} לתפקיד ${input.positionTitle}${employer}.${location}\nבהצלחה!`
}

export function buildInterviewWhatsAppUrl(input: InterviewReminderInput): string | null {
  const phone = normalizeIsraeliPhoneForWhatsApp(input.phone)
  if (!phone) return null

  return `https://wa.me/${phone}?text=${encodeURIComponent(buildInterviewReminderMessage(input))}`
}